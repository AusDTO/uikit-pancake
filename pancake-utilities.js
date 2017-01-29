#!/usr/bin/env node

/***************************************************************************************************************************************************************
 *
 * Pancake utilities
 *
 **************************************************************************************************************************************************************/

'use strict';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const CFonts = require(`cfonts`);
const Chalk = require('chalk');
const Path = require(`path`);
const Fs = require(`fs`);


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Variables
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * npm organization for scoped packages, this is what we are looking into when searching for dependency issues
 *
 * @type constant {String}
 */
const npmOrg = '@gov.au';

/**
 * This keyword will signal to us that the package we found is a legitimate uikit module
 *
 * @type constant {String}
 */
const controlKeyword = 'uikit-module';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Objects / functions
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Debugging prettiness
 *
 * @type {Object}
 */
const Log = {
	output: false,   //have we outputted something yet?
	hasError: false, //let's assume the best

	/**
	 * Log an error
	 *
	 * @param  {string}  text - The text you want to log with the error
	 */
	error: ( text ) => {
		if( !Log.output ) { //if we haven't printed anything yet
			Log.space();      //only then we add an empty line on the top
		}

		if( !Log.hasError ) {
			CFonts.say(`CONFLICT`, { //we need something big to help npms error system
				colors: ['red', 'red'],
				space: false,
			});

			const messages = [ //because errors don't have to be boring!
				'Uh oh!',
				'Sorry!',
				'Doh!',
				'Oh my!',
				'Ouch!',
				'Ups!',
				':(',
				':`(',
				'-_-',
			];

			console.error( Chalk.red( messages.sort( () => 0.5 - Math.random() )[0] ) );
			console.log('\n');
		}

		console.error(`🔥  ${ Chalk.red( `ERROR:   ${ text }` ) } `);

		Log.output = true; //now we have written something out
		Log.hasError = true;
	},

	/**
	 * Log a message
	 *
	 * @param  {string}  text - The text you want to log
	 */
	info: ( text ) => {
		if( !Log.output ) {
			Log.space();
		}

		console.info(`🔔  INFO:    ${ text }`);
		Log.output = true;
	},

	/**
	 * Log success
	 *
	 * @param  {string}  text - The text you want to log
	 */
	ok: ( text ) => {
		if( !Log.output ) {
			Log.space();
		}

		console.info(`👍           ${ Chalk.green( text ) }`);
		Log.output = true;
	},

	/**
	 * Log a verbose message
	 *
	 * @param  {string}  text    - The text you want to log
	 * @param  {boolean} verbose - Verbose flag either undefined or true
	 */
	verbose: ( text, verbose ) => {
		if( verbose ) {
			if( !Log.output ) {
				Log.space();
			}

			console.info(`😬  ${ Chalk.gray( `VERBOSE: ${ text }` ) }`);
			Log.output = true;
		}
	},

	/**
	 * Add some space to the output
	 */
	space: () => {
		console.log(`\n`);
	},

	/**
	 * Return true if we printed a message already
	 *
	 * @return {boolean} - Whether or not we've outputted something yet
	 */
	hadOutput: () => {
		return Log.output;
	},
};


/**
 * Handle exiting of program
 *
 * @param {null}   exiting - null for bind
 * @param {object} error   - Object to distinguish between closing events
 */
function ExitHandler( exiting, error ) {
	if( error && error !== 1 ) {
		try { //try using our pretty output
			Log.error( error );
		}
		catch( error ) { //looks like it's broken too so let's just do the old school thing
			console.error( error );
		}
	}

	if( exiting.now ) {
		process.exit( 0 ); //exit now
	}

	if( Log.output ) { //if we printed to cli at all
		Log.space();     //adding some space
	}

	process.exit( 0 ); //now exit with a smile :)
}


/**
 * Create a path if it doesn't exist
 *
 * @param  {string}  dir      - The path to be checked and created if not found
 * @param  {boolean} verbose  - Verbose flag either undefined or true
 */
const CreateDir = ( dir, verbose ) => {
	Log.verbose(`Creating path ${ Chalk.yellow( dir ) }`, verbose);

	const splitPath = dir.split('/');

	splitPath.reduce( ( path, subPath ) => {
		let currentPath;

		if( subPath != '.' ) {
			currentPath = `${ path }/${ subPath }`;

			if( !Fs.existsSync( currentPath ) ){
				Fs.mkdirSync( currentPath );
			}
		}
		else {
			currentPath = subPath;
		}

		return currentPath;
	}, '');
};


/**
 * Get all folders within a given path
 *
 * @param  {string}  thisPath - The path that contains the desired folders
 * @param  {boolean} verbose  - Verbose flag either undefined or true
 *
 * @return {array}            - An array of paths to each folder
 */
const GetFolders = ( thisPath, verbose ) => {
	Log.verbose(`Running GetFolders on ${ Chalk.yellow( thisPath ) }`, verbose);

	try {
		return Fs
			.readdirSync( thisPath )                                               //read the folders content
			.filter(
				thisFile => Fs.statSync(`${ thisPath }/${ thisFile }`).isDirectory() //only return directories
			)
			.map( path => Path.normalize(`${ thisPath }/${ path }`) );             //return with path
	}
	catch( error ) {
		Log.verbose(`${ Chalk.yellow( thisPath ) } not found`, verbose);

		return [];
	}
};


/**
 * Reading a package.json file
 *
 * @param  {string}  pkgPath - The path to the folder the package.json is in (omitting package.json)
 * @param  {boolean} verbose - Verbose flag either undefined or true
 *
 * @return {promise object}  - Returns a promise and some of the data of the package.json
 */
const ReadPackage = ( pkgPath, verbose ) => {
	const thisPath = Path.normalize(`${ pkgPath }/package.json`);

	Log.verbose(`Reading ${ Chalk.yellow( thisPath ) }`, verbose);

	return new Promise( ( resolve, reject ) => {
		Fs.readFile( thisPath, `utf8`, ( error, data ) => {
			if( error ) {
				Log.verbose(`No package.json found in ${ Chalk.yellow( thisPath ) }`, verbose); //folders like .bin and .staging won't have package.json inside

				resolve( null );
			}
			else {

				const packageJson = JSON.parse( data ); //parse the package.json

				if( packageJson.keywords.indexOf( controlKeyword ) !== -1 ) { //is this a uikit module?
					Log.verbose(`${ Chalk.green('✔') } Identified ${ Chalk.yellow( packageJson.name ) } as uikit module`, verbose);

					//we only want a subset
					const miniPackage = {
						name: packageJson.name,
						version: packageJson.version,
						peerDependencies: packageJson.peerDependencies,
						uikit: packageJson.uikit,
						path: pkgPath,
					}

					resolve( miniPackage );
				}
				else {
					resolve( null ); //non-uikit packages get null so we can identify them later and filter them out
				}
			}
		});
	});
};


/**
 * Get an object of all uikit modules package.json inside a specified folder
 *
 * @param  {string}  pkgPath - The path that includes your node_module folder
 * @param  {boolean} verbose - Verbose flag either undefined or true
 *
 * @return {promise object}  - A promise.all that resolves when all package.jsons have been read
 */
const GetPackages = ( pkgPath, verbose ) => {
	if( typeof pkgPath !== 'string' || pkgPath.length <= 0 ) {
		Log.error(`GetPackages only takes a valid path. You passed [type: ${ Chalk.yellow( typeof pkgPath ) }] "${ Chalk.yellow( pkgPath ) }"`, verbose);
	}

	pkgPath = Path.normalize(`${ pkgPath }/node_modules/${ npmOrg }/`); //we add our npm org to the path

	Log.verbose(`Looking for uikit modules in: ${ Chalk.yellow( pkgPath ) }`, verbose);

	const allModules = GetFolders( pkgPath );          //all folders inside the selected path

	if( allModules !== undefined && allModules.length > 0 ) {
		Log.verbose(`Found the following module folders:\n${ Chalk.yellow( allModules.join('\n') ) }`, verbose);

		const allPackages = allModules.map( pkg => ReadPackage(pkg, verbose) ); //read all packages and save the promise return

		return Promise.all( allPackages ).then( ( packages ) => { //chaining the promise
			return packages.filter( p => p !== null );              //making sure packages not identified as uikit don't leave a trace in the returned array
		});
	}
	else {
		return Promise.resolve([]); //no uikit modules found at all
	}
};


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exporting all the things
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports = ( verbose ) => {
	return {
		Log: {
			output: Log.hadOutput,
			error: Log.error,
			info: Log.info,
			ok: Log.ok,
			verbose: ( text ) => Log.verbose( text, verbose ),           //we need to pass verbose mode here
			space: Log.space,
		},
		ExitHandler: ExitHandler,
		CreateDir: ( thisPath ) => CreateDir( thisPath, verbose ),     //we need to pass verbose mode here
		GetFolders: ( thisPath ) => GetFolders( thisPath, verbose ),   //we need to pass verbose mode here
		GetPackages: ( thisPath ) => GetPackages( thisPath, verbose ), //we need to pass verbose mode here
		npmOrg: npmOrg,
		controlKeyword: controlKeyword,
	}
};