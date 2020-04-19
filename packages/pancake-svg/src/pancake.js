/***************************************************************************************************************************************************************
 *
 * Plug-in for Pancake
 *
 * Move SVGs and generate SVG sprites and fallback PNGs
 *
 * @repo    - https://github.com/govau/pancake
 * @author  - Michael Arthur
 * @license - https://raw.githubusercontent.com/govau/pancake/master/LICENSE (MIT)
 *
 **************************************************************************************************************************************************************/

'use strict';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const Path = require( 'path' );
const Fs = require( 'fs' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Module imports
//--------------------------------------------------------------------------------------------------------------------------------------------------------------

import { Log, Style, Loading, CopyFile, ReadFile, WriteFile } from '@gov.au/pancake';
import { CompileAllSvgs } from './svg';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Plugin export
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * The main pancake method for this plugin
 *
 * @param  {array}  version        - The version of mother pancake
 * @param  {array}  modules        - An array of all module objects
 * @param  {object} settings       - An object of the host package.json file and it’s path
 * @param  {object} GlobalSettings - An object of the global settings
 * @param  {object} cwd            - The path to the working directory of our host package.json file
 *
 * @return {Promise object}  - Returns an object of the settings we want to save
 */
module.exports.pancake = ( version, modules, settings, GlobalSettings, cwd ) => {
	Loading.start('pancake-svg');

//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Settings
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	let SETTINGS = {
		svg: {
			modules: false,
			pngs: 'pancake/svg/png/',
			location: 'pancake/svg/',
			name: 'pancake.sprite.svg',
		},
	};

	//merging settings with host settings
	Object.assign( SETTINGS.svg, settings.svg );


	return new Promise( ( resolve, reject ) => {
		//some housekeeping
		if( typeof version !== 'string' ) {
			reject(
				`Plugin pancake-svg got a mismatch for the data that was passed to it! ${ Style.yellow(`version`) } was ${ Style.yellow( typeof version ) } ` +
				`but should have been ${ Style.yellow(`string`) }`
			);
		}

		if( typeof modules !== 'object' ) {
			reject(
				`Plugin pancake-svg got a mismatch for the data that was passed to it! ${ Style.yellow(`modules`) } was ${ Style.yellow( typeof modules ) } ` +
				`but should have been ${ Style.yellow(`object`) }`
			);
		}

		if( typeof settings !== 'object' ) {
			reject(
				`Plugin pancake-svg got a mismatch for the data that was passed to it! ${ Style.yellow(`settings`) } was ${ Style.yellow( typeof settings ) } ` +
				`but should have been ${ Style.yellow(`object`) }`
			);
		}

		if( typeof cwd !== 'string' ) {
			reject(
				`Plugin pancake-svg got a mismatch for the data that was passed to it! ${ Style.yellow(`cwd`) } was ${ Style.yellow( typeof cwd ) } ` +
				`but should have been ${ Style.yellow(`string`) }`
			);
		}


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Variables to be filled
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
		let compiledAll = [];      //for collect all promises

//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Iterate over each module
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
		for( const modulePackage of modules ) {
			Log.verbose(`SVG: Building ${ Style.yellow( modulePackage.name ) }`);

			//check if there are svg files
			let svgModulePath;
			if( modulePackage.pancake['pancake-module'].svg !== undefined ) {
				svgModulePath = Path.normalize(`${ modulePackage.path }/${ modulePackage.pancake['pancake-module'].svg.path }`);
			}
			if( !Fs.existsSync( svgModulePath ) ) {
				Log.verbose(`SVG: No SVG found in ${ Style.yellow( modulePackage.name ) }`);
			}
			else {
				Log.verbose(`SVG: ${ Style.green('⌘') } Found SVG files in ${ Style.yellow( svgModulePath ) }`);

				compiledAll.push(Promise.resolve(svgModulePath));
			}
		}


		if( modules.length < 1 ) {
			Loading.stop('pancake-svg'); //stop loading animation

			Log.info(`No pancake modules found 😬`);
			resolve( SETTINGS );
		}
		else {

			//after all files have been compiled and written
			CompileAllSvgs(compiledAll, SETTINGS.svg, cwd)
				.catch( error => {
					Loading.stop('pancake-svg'); //stop loading animation

					Log.error(`SVG plugin ran into an error: ${ error }`);
				})
				.then( () => {
					Loading.stop('pancake-svg'); //stop loading animation

					Log.ok('SVG PLUGIN FINISHED');
					resolve( SETTINGS );
			});
		}

	});
}
