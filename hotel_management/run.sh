#!/bin/sh

set -e 

echo "================================RUNNING MIGRATIONS======================================"

python manage.py makemigrations


python manage.py migrate --noinput

echo "================================✅ DONE MIGRATES======================================"


uvicorn hotel_management.asgi:application --host 0.0.0.0 --port 8000 --log-level info --access-log --use-colors


