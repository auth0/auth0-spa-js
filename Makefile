.PHONY: install lint test build publish

install:
	@echo "Running install..."
	npm ci

lint:
	@echo "Running lint..."
	npm run lint

test:
	@echo "Running test..."
	npm run test

build:
	@echo "Running build..."
	rm -rf build && npm run build

publish:
	@echo "Running cdn-publish..."
	npm run publish:cdn