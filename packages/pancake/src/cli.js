/***************************************************************************************************************************************************************
 *
 * Running pancake inside a cli
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
import Path from 'path';
import Fs from 'fs';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Module imports
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
import { ParseArgs } from './parse-arguments';
import { ExitHandler, Cwd } from './helpers';
import { Settings } from './settings';
import { Log } from './logging';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Default export
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Running the program in CLI
 *
 * @param  {array} argv - The arguments passed to node
 */
export const init = ( argv = process.argv ) => {

	Log.info(`PANCAKE MIXING THE BATTER`);

//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Get global settings
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	let SETTINGS = Settings.get();


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Parsing cli arguments
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	const ARGS = ParseArgs( SETTINGS );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Set global settings
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	if( ARGS.set.length > 0 ) {
		SETTINGS = Settings.set( ARGS.set[ 0 ], ARGS.set[ 1 ], SETTINGS );
	}


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Display help
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	//


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Finding the current working directory
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	const pkgPath = Cwd( ARGS.cwd );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// check for conflicts
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	//


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Install all plugins
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	//


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Run all plugins
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	//


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Adding some event handling to exit signals
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	process.on( 'exit', ExitHandler.bind( null, { withoutSpace: false } ) );              //on closing
	process.on( 'SIGINT', ExitHandler.bind( null, { withoutSpace: false } ) );             //on [ctrl] + [c]
	process.on( 'uncaughtException', ExitHandler.bind( null, { withoutSpace: false } ) );  //on uncaught exceptions
}