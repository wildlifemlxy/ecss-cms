from django.core.management.base import BaseCommand
from django.conf import settings
import sys
import os

class Command(BaseCommand):
    help = 'Check if the Django application is properly configured and running'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Django Health Check'))
        self.stdout.write('-' * 50)
        
        # Check Python version
        self.stdout.write(f'Python version: {sys.version}')
        
        # Check Django settings
        self.stdout.write(f'DEBUG mode: {settings.DEBUG}')
        self.stdout.write(f'Database: {settings.DATABASES["default"]["ENGINE"]}')
        self.stdout.write(f'Allowed hosts: {settings.ALLOWED_HOSTS}')
        
        # Check environment variables
        env_vars = ['SECRET_KEY', 'WOOCOMMERCE_API_URL', 'WOOCOMMERCE_CONSUMER_KEY']
        for var in env_vars:
            value = os.environ.get(var, 'Not set')
            masked_value = value[:10] + '...' if len(value) > 10 else value
            self.stdout.write(f'{var}: {masked_value}')
        
        # Check installed apps
        self.stdout.write(f'Installed apps: {len(settings.INSTALLED_APPS)}')
        
        self.stdout.write(self.style.SUCCESS('✅ Health check completed successfully!'))
