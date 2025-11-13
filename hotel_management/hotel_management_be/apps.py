from django.apps import AppConfig


class UserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hotel_management_be'

    def ready(self):
        import hotel_management_be.signal