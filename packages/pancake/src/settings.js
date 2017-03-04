/***************************************************************************************************************************************************************
 *
 * Get and set global settings
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
// Included modules
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
import { Log, Style } from './logging';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Default export
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Finding the right folder in which to run npm prefix
 *
 * @return {string} - The absolute path to the folder of your host package.json
 */
export const Settings = {
	/**
	 * Getting global setting from the settings.json file
	 *
	 * @return {object} - The settings object
	 */
	get: () => {
		Log.verbose(`Getting global settings`);

		let SETTINGS = {};

		try {
			SETTINGS = JSON.parse( Fs.readFileSync( Path.normalize(`${ __dirname }/../settings.json`), `utf8` ) );
		}
		catch( error ) {
			Log.error(`Couldn’t read settings :(`);

			process.exit( 1 );
		}

		Log.verbose( Style.yellow( JSON.stringify( SETTINGS ) ) );

		return SETTINGS;
	},


	/**
	 * Writing new global settings to the settings.json file
	 *
	 * @param  {string} setting  - The setting to be changed
	 * @param  {string} value    - The value the above setting should be set to
	 * @param  {object} SETTINGS - The settings object so we don’t have to read it twice
	 *
	 * @return {object}          - The settings object with the new setting
	 */
	set: ( setting, value, SETTINGS ) => {
		Log.space();
		Log.info(`PANCAKE SAVING DEFAULT SETTING`);

		if( SETTINGS[ setting ] !== undefined ) {
			SETTINGS[ setting ] = value; //setting new value

			try {
				Fs.writeFileSync( Path.normalize(`${ __dirname }/../settings.json`), JSON.stringify( SETTINGS, null, '\t' ), 'utf8' );

				Log.ok(`Value for ${ Style.yellow( setting ) } saved`);
			}
			catch( error ) {
				Log.error(`Saving settings failed`);
				Log.error( error );
			}
		}
		else {
			Log.error(`Setting ${ Style.yellow( setting ) } not found`);
		}
	},
};