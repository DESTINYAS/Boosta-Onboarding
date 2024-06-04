refresh-local:
	rm -rf dist
	rm -r docker/compose-files/dev-data
	docker compose -f docker/compose-files/docker-compose.local.yml kill down
	docker compose -f docker/compose-files/docker-compose.local.yml rm -vf --remove-orphans


start-local:
	docker compose -f docker/compose-files/docker-compose.local.yml up -d
	docker compose -f docker/compose-files/docker-compose.local.yml logs -f boosta-onboarding-db
	
kill-local:
	docker compose -f docker/compose-files/docker-compose.local.yml down

start-db:
	docker compose -f docker/docker-compose.yml up
	
create-network:
	docker network create boosta-network

# * Local:  development
run-locally:
	docker compose -f docker/compose-files/docker-compose.yml up -d


# * start app
build-app-locally:
	docker compose -f docker/compose-files/docker-compose.yml build boosta-onboarding-app --no-cache
	
stop-app-locally:
	docker compose -f docker/compose-files/docker-compose.yml stop boosta-onboarding-app

# * end app

build-locally:
	docker compose -f docker/compose-files/docker-compose.yml build --no-cache

stop-locally:
	docker compose -f docker/compose-files/docker-compose.yml stop

kill-locally:
	docker compose -f docker/compose-files/docker-compose.yml down

follow-logs:
	docker compose -f docker/compose-files/docker-compose.yml logs -f boosta-onboarding-app

restart-app-proxy:
	docker compose -f docker/compose-files/docker-compose.yml restart boosta-onboarding-proxy