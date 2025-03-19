#!/bin/bash

DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
export DATABASE_URL

JWT_SECRET=$(cat "$JWT_TOKEN_FILE")
export JWT_SECRET

npx prisma db push --skip-generate

exec "$@"