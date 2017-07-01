.PHONY: default setup clean build lint test

# Put Node bins in path
export PATH := node_modules/.bin:$(PATH)

default: build

setup:
	yarn install

clean:
	rm -rf lib

build: clean
	tsc

lint:
	tslint --type-check --project tsconfig.json