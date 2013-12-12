test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require should \
		--harmony-generators \
		--reporter spec

clean:
	@rm -rf node_modules

.PHONY: test clean