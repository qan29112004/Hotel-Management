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
