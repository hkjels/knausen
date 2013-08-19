
COMPONENT=node_modules/.bin/component


build: components lib/**/*.js
	@$(COMPONENT) build -n app -o public

components: component.json lib/**/component.json
	@$(COMPONENT) install

clean:
	rm public/app.{js,css}
	rm -rf components


.PHONY: build components clean

