import requests
from django.conf import settings

class PayPalService:
    @staticmethod
    def get_access_token():
        """Lấy access token từ PayPal"""
        config = settings.PAYPAL_CONFIG
        url = f"{config['base_url']}/v1/oauth2/token"
        headers = {"Accept": "application/json", "Accept-Language": "en_US"}
        data = {"grant_type": "client_credentials"}

        response = requests.post(url, headers=headers, data=data, auth=(config["client_id"], config["client_secret"]))
        response.raise_for_status()
        return response.json()["access_token"]

    @staticmethod
    def create_order(amount, currency, booking_uuid):
        """Tạo order mới trên PayPal"""
        access_token = PayPalService.get_access_token()
        config = settings.PAYPAL_CONFIG

        url = f"{config['base_url']}/v2/checkout/orders"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": str(booking_uuid),
                    "amount": {
                        "currency_code": currency,
                        "value": f"{float(amount):.2f}"
                    },
                }
            ],
            "application_context": {
                "return_url": "https://nonfreezing-malena-ungambling.ngrok-free.dev/api/payment/paypal-success/",
                "cancel_url": "https://nonfreezing-malena-ungambling.ngrok-free.dev/api/payment/paypal-cancel/"
            }
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    @staticmethod
    def capture_payment(order_id):
        """Xác nhận thanh toán sau khi người dùng approve"""
        access_token = PayPalService.get_access_token()
        config = settings.PAYPAL_CONFIG
        url = f"{config['base_url']}/v2/checkout/orders/{order_id}/capture"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        try:
            response = requests.post(url, headers=headers)
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print(e.response.json())
        return response.json()
    
    @staticmethod
    def get_capture_info(capture_id):
        access_token = PayPalService.get_access_token()
        config = settings.PAYPAL_CONFIG
        url = f"{config['base_url']}/v2/payments/captures/{capture_id}"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    
    @staticmethod
    def refund_payment(capture_id, amount=None, currency="USD", note=""):
        """
        Hoàn tiền cho PayPal payment
        
        Args:
            capture_id: ID của capture transaction (transaction_id từ Payment)
            amount: Số tiền hoàn (None = full refund)
            currency: Loại tiền tệ
            note: Ghi chú
        
        Returns:
            dict: Kết quả refund từ PayPal
        """
        print("check refund paypal: ", capture_id, amount, currency)
        cap = PayPalService.get_capture_info(capture_id)
        access_token = PayPalService.get_access_token()
        config = settings.PAYPAL_CONFIG
        url = f"{config['base_url']}/v2/payments/captures/{capture_id}/refund"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        payload = {}
        if amount:
            payload["amount"] = {
                "value": f"{float(amount):.2f}",
                "currency_code": currency
            }
        if note:
            payload["note_to_payer"] = note
        
        try:
            response = requests.post(url, headers=headers, json=payload if payload else None)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_data = e.response.json() if e.response.content else {}
            raise Exception(f"PayPal refund failed: {error_data}")