/**
 * depdoc
 * @author: Zander Martineau
 *
 * USAGE:
 * depdoc package.json ✔
 * depdoc https://raw.githubusercontent.com/mrmartineau/depdoc/master/package.json ✔
 *
 * TODO:
 * - Create an online version that takes json pasted in a textarea
 * - If zero dependencies, tell the user about it
 * - Error handling:
 *   - if the registry is down
 *   - if the path/filename is incorrect/doesn't exist
 *   - if the package has no dependencies ✔
 */

var fs = require('fs');
var _ = require('lodash');
var registryUrl = require('registry-url')();
var request = require('sync-request');
var Mustache = require('mustache');


function depdoc(input) {
	var result;
	var input = arguments[0];
	var type = arguments.length > 1 ? arguments[1] : undefined;

	if (type === 'json') {
		result = getPackageInformation(input);

	} else if (input.indexOf('github') > 0) {
		var newPackageUrl = input.replace('raw.githubusercontent.com', 'rawgit.com');
		var res = request('GET', newPackageUrl);
		var data = res.getBody('utf-8').toString();
		result = getPackageInformation(JSON.parse(data));

	} else {
		var readFile = fs.readFileSync(input);
		result = getPackageInformation(JSON.parse(readFile));
	}

	return result;
}


/**
 * Get package.json contents
 */
function getPackageInformation(data) {
	var deps = data.dependencies;
	var result = '';

	if (_.isEmpty(deps)) {
		return 'This package has no dependencies :(';
	}

	_.forEach(deps, function(value, key){

		var res = request('GET', registryUrl + key);
		var data = res.getBody('utf-8').toString();

		var packageInfo = JSON.parse(data);
		var packageInfoData = {
			name: packageInfo.name,
			description: typeof packageInfo.description !== 'undefined' ? packageInfo.description : '',
			homepage: typeof packageInfo.homepage !== 'undefined' ? packageInfo.homepage : '',
			repo: typeof packageInfo.repository !== 'undefined' ? packageInfo.repository : '',
			issues: typeof packageInfo.bugs !== 'undefined' ? packageInfo.bugs.url : '',
			license: typeof packageInfo.license !== 'undefined' ? packageInfo.license : ''
		}

		// TODO: Improve this:
		result += Mustache.render("## {{name}}{{#description}}\n{{{description}}}\n{{/description}}\n[npm](http://npmjs.org/{{name}}){{#homepage}} - [Homepage]({{{homepage}}}){{/homepage}}{{#repo}} - [Repository]({{{repo.url}}}){{/repo}}{{#issues}} - [Issues]({{{issues}}}){{/issues}}{{#license}} - Licence: {{license}}{{/license}}\n\nInstall with `npm install {{name}}`\n\n---\n", packageInfoData);
		// console.log(result);
	});

	return result;
}

module.exports = depdoc;
