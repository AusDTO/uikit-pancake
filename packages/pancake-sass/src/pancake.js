/***************************************************************************************************************************************************************
 *
 * Plug-in for Pancake
 *
 * Move and compile Sass partials.
 *
 * @repo    - https://github.com/govau/pancake
 * @author  - Dominik Wilkowski
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
const { Log, Style, Loading, ReadFile, WriteFile } = require( '@gov.au/pancake' );
const { StripDuplicateLines } = require( './helpers' );
const { GenerateSass, Sassify } = require( './sass' );

Log.output = true; //this plugin assumes you run it through pancake


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
	Loading.start( 'pancake-sass', Log.verboseMode );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Settings
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	let SETTINGS = {
		css: {
			minified: true,
			modules: false,
			browsers: [ 'last 2 versions', 'ie 8', 'ie 9', 'ie 10' ],
			location: 'pancake/css/',
			name: 'pancake.min.css',
		},
		sass: {
			modules: false,
			location: 'pancake/sass/',
			name: 'pancake.scss',
		},
	};

	//merging settings with host settings
	Object.assign( SETTINGS.css, settings.css );
	Object.assign( SETTINGS.sass, settings.sass );


	return new Promise( ( resolve, reject ) => {
		//some housekeeping
		if( typeof version !== 'string' ) {
			reject(
				`Plugin pancake-sass got a mismatch for the data that was passed to it! ${ Style.yellow(`version`) } was ${ Style.yellow( typeof version ) } ` +
				`but should have been ${ Style.yellow(`string`) }`
			);
		}

		if( typeof modules !== 'object' ) {
			reject(
				`Plugin pancake-sass got a mismatch for the data that was passed to it! ${ Style.yellow(`modules`) } was ${ Style.yellow( typeof modules ) } ` +
				`but should have been ${ Style.yellow(`object`) }`
			);
		}

		if( typeof settings !== 'object' ) {
			reject(
				`Plugin pancake-sass got a mismatch for the data that was passed to it! ${ Style.yellow(`settings`) } was ${ Style.yellow( typeof settings ) } ` +
				`but should have been ${ Style.yellow(`object`) }`
			);
		}

		if( typeof cwd !== 'string' ) {
			reject(
				`Plugin pancake-sass got a mismatch for the data that was passed to it! ${ Style.yellow(`cwd`) } was ${ Style.yellow( typeof cwd ) } ` +
				`but should have been ${ Style.yellow(`string`) }`
			);
		}


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Variables to be filled
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
		let compiledAll = [];      //for collect all promises
		let allSass = '';          //all modules to be collected for SETTINGS.css.name file
		let sassVersioning = false; //let’s assume the pancake module was build with sass-versioning
		const sassVersioningPath = ( Fs.existsSync( Path.normalize( `${ cwd }/../node_modules/sass-versioning` ) ) )
			? Path.normalize( `${ cwd }/../node_modules/sass-versioning/dist/_index.scss` ).replace(/\\/g, "\\\\")
			: Path.normalize( `${ cwd }/node_modules/sass-versioning/dist/_index.scss` ).replace(/\\/g, "\\\\");

		const Package = require( Path.normalize(`${ __dirname }/../package.json`) );
		const banner = `/*! PANCAKE v${ version } PANCAKE-SASS v${ Package.version } */\n\n` +
			`/*\n` +
			` * THIS FILE IS AUTOGENERATED EVERY TIME YOU INSTALL A PANCAKE MODULE.\n` +
			` * DO NOT EDIT THIS FILE AND AVOID COMMITTING IT TO VERSION CONTROL.\n */\n\n`;


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Iterate over each module
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
		for( const modulePackage of modules ) {
			Log.verbose(`Sass: Building ${ Style.yellow( modulePackage.name ) }`);

			//check if there are sass files
			let sassModulePath;
			if( modulePackage.pancake['pancake-module'].sass !== undefined && modulePackage.pancake['pancake-module'].sass.path !== false ) {
				sassModulePath = Path.normalize(`${ modulePackage.path }/${ modulePackage.pancake['pancake-module'].sass.path }`);
			}

			if( !Fs.existsSync( sassModulePath ) ) {
				Log.verbose(`Sass: No Sass found in ${ Style.yellow( sassModulePath ) }`)
			}
			else {
				Log.verbose(`Sass: ${ Style.green('⌘') } Found Sass files in ${ Style.yellow( sassModulePath ) }`);

				//generate the import statements depending on dependencies
				let sass = GenerateSass( modulePackage.path, modulePackage.name, modules, GlobalSettings.npmOrg );
				allSass += sass; //for SETTINGS.css.name file

				// adding banner and conditional sass-versioning
				if( modulePackage.pancake['pancake-module'].sass['sass-versioning'] === true ) {
					sassVersioning = true; //setting this if we encounter at least one module with sass-versioning enabled

					sass = `${ banner }` +
						`/* ${ modulePackage.name } v${ modulePackage.version } */\n\n` +
						`@import "${ sassVersioningPath }";\n\n` +
						`${ sass }\n`
				}
				else {
					sass = `/* ${ modulePackage.name } v${ modulePackage.version } */\n\n${ sass }\n`;
				}

				//write css file
				if( SETTINGS.css.modules ) {
					const location = Path.normalize(`${ cwd }/${ SETTINGS.css.location }/${ modulePackage.name.split('/')[ 1 ] }.css`);

					compiledAll.push(
						Sassify( location, SETTINGS.css, sass ) //generate css and write file
							.catch( error => {
								Log.error( error );
						})
					);
				}

				//write sass file
				if( SETTINGS.sass.modules ) {
					const location = Path.normalize(`${ cwd }/${ SETTINGS.sass.location }/${ modulePackage.name.split('/')[ 1 ] }.scss`);

					compiledAll.push(
						WriteFile( location, sass ) //write file
							.catch( error => {
								Log.error( error );

								process.exit( 1 );
						})
					);
				}
			}
		}


		if( modules.length < 1 ) {
			Loading.stop( 'pancake-sass', Log.verboseMode ); //stop loading animation

			Log.info(`No pancake modules found 😬`);
			resolve( SETTINGS );
		}
		else {

			//write the SETTINGS.css.name file
			const locationCSS = Path.normalize(`${ cwd }/${ SETTINGS.css.location }/${ SETTINGS.css.name }`);

			if( sassVersioning === true ) {
				allSass = `${ banner }` +
					`@import "${ sassVersioningPath }";\n\n` +
					`${ StripDuplicateLines( allSass ) }\n\n`
			}
			else {
				allSass = `${ banner }${ StripDuplicateLines( allSass ) }\n`;
			}

			//generate SETTINGS.css.name file
			if( SETTINGS.css.name !== false ) {
				compiledAll.push(
					Sassify( locationCSS, SETTINGS.css, allSass )
						.catch( error => {
							Log.error( error );
					})
				);
			}

			//write SETTINGS.sass.name file
			if( SETTINGS.sass.name !== false ) {
				const locationSASS = Path.normalize(`${ cwd }/${ SETTINGS.sass.location }/${ SETTINGS.sass.name }`);

				compiledAll.push(
					WriteFile( locationSASS, allSass ) //write file
						.catch( error => {
							Log.error( error );

							process.exit( 1 );
					})
				);
			}

			//after all files have been compiled and written
			Promise.all( compiledAll )
				.catch( error => {
					Loading.stop( 'pancake-sass', Log.verboseMode ); //stop loading animation

					Log.error(`Sass plugin ran into an error: ${ error }`);
				})
				.then( () => {
					Log.ok('SASS PLUGIN FINISHED');

					Loading.stop( 'pancake-sass', Log.verboseMode ); //stop loading animation
					resolve( SETTINGS );
			});
		}

	});
}
