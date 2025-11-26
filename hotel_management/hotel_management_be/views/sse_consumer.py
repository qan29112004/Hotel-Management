import json
import time
import asyncio
import logging
from channels.generic.http import AsyncHttpConsumer
from channels.exceptions import StopConsumer
from libs.Redis import RedisUtils

logger = logging.getLogger(__name__)


class SSEConsumer(AsyncHttpConsumer):
    """ASGI Consumer cho SSE - hoạt động với Django 4.2 + Uvicorn"""
    
    async def handle(self, body):
        # Lấy session_id từ URL path
        session_id = None
        try:
            session_id = self.scope.get('url_route', {}).get('kwargs', {}).get('session_id')
        except (KeyError, AttributeError):
            pass
        
        # Fallback: parse từ path nếu kwargs không có
        if not session_id:
            import re
            path = self.scope.get('path', '')
            match = re.search(r'/sse/session/([^/]+)', path)
            if match:
                session_id = match.group(1)
        
        if not session_id:
            await self.send_response(404, b"Session ID required", headers=[(b"content-type", b"text/plain")])
            return
        
        logger.info(f"[SSE] New SSE connection for session: {session_id}")
        
        # Headers cho SSE
        headers = [
            (b"content-type", b"text/event-stream; charset=utf-8"),
            (b"cache-control", b"no-cache, no-transform"),
            (b"x-accel-buffering", b"no"),
            (b"connection", b"keep-alive"),
            (b"access-control-allow-origin", b"*"),
            (b"access-control-allow-headers", b"cache-control"),
        ]
        
        # Gửi HTTP response headers (status 200 với empty body ban đầu)
        await self.send_response(200, b"", headers=headers)
        
        try:
            # Gửi message đầu tiên
            exists, ttl = await asyncio.to_thread(RedisUtils.check_session, session_id)
            logger.info(f"[SSE] Initial check for {session_id}: exists={exists}, ttl={ttl}")
            
            initial_data = json.dumps({
                'exist': exists,
                'ttl': ttl,
                'session_id': session_id,
                'connected': True
            })
            
            # Gửi data đầu tiên
            await self.send_body(f"data: {initial_data}\n\n".encode('utf-8'), more_body=True)
            await self.send_body(b": keepalive\n\n", more_body=True)
            
            # Thiết lập Redis pubsub
            pubsub = RedisUtils.r.pubsub()
            pubsub.subscribe('session_status_channel')
            logger.info(f"[SSE] Subscribed to channel for session: {session_id}")
            
            last_heartbeat = time.time()
            last_keepalive = time.time()
            
            # Task để xử lý Redis messages và keepalive
            async def process_redis_messages():
                nonlocal last_heartbeat, last_keepalive
                
                try:
                    while True:
                        # Poll Redis message (non-blocking)
                        try:
                            message = await asyncio.to_thread(pubsub.get_message)
                            
                            if message:
                                # Bỏ qua subscribe confirmation
                                if message.get('type') == 'subscribe':
                                    continue
                                
                                # Message thật từ Redis
                                if message.get('type') == 'message':
                                    try:
                                        data = json.loads(message['data'])
                                        logger.info(f"[SSE] Received from Redis: {data}")
                                        
                                        if data.get("session_id") == session_id:
                                            logger.info(f"[SSE] Sending to client: {data}")
                                            await self.send_body(
                                                f"data: {json.dumps(data)}\n\n".encode('utf-8'),
                                                more_body=True
                                            )
                                            last_heartbeat = time.time()
                                    except Exception as e:
                                        logger.error(f"[SSE] Error processing message: {e}")
                        except Exception as e:
                            logger.debug(f"[SSE] Redis get_message error: {e}")
                        
                        # Keepalive comment mỗi 5 giây
                        current_time = time.time()
                        if current_time - last_keepalive > 5:
                            await self.send_body(b": keepalive\n\n", more_body=True)
                            last_keepalive = current_time
                        
                        # Heartbeat mỗi 15 giây
                        if current_time - last_heartbeat > 15:
                            logger.info(f"[SSE] Sending heartbeat for {session_id}")
                            heartbeat_data = json.dumps({
                                'ping': True,
                                'session_id': session_id
                            })
                            await self.send_body(
                                f"data: {heartbeat_data}\n\n".encode('utf-8'),
                                more_body=True
                            )
                            last_heartbeat = current_time
                        
                        # Sleep nhỏ để tránh CPU 100%
                        await asyncio.sleep(0.1)
                        
                except asyncio.CancelledError:
                    logger.info(f"[SSE] Redis message task cancelled for {session_id}")
                    raise
                except Exception as e:
                    logger.error(f"[SSE] Error in Redis message processing: {e}", exc_info=True)
                finally:
                    try:
                        pubsub.unsubscribe()
                        pubsub.close()
                    except Exception:
                        pass
            
            # Chạy task xử lý Redis messages
            task = asyncio.create_task(process_redis_messages())
            
            try:
                # Giữ connection sống và đợi task hoàn thành hoặc bị cancel
                await task
            except asyncio.CancelledError:
                logger.info(f"[SSE] Connection cancelled for {session_id}")
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
            finally:
                # Cleanup
                try:
                    pubsub.unsubscribe()
                    pubsub.close()
                except Exception:
                    pass
                    
        except Exception as e:
            logger.error(f"[SSE] Error in SSE stream: {e}", exc_info=True)
        finally:
            # Kết thúc stream
            try:
                await self.send_body(b"", more_body=False)
            except Exception:
                pass
            raise StopConsumer()

