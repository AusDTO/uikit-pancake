/***************************************************************************************************************************************************************
 *
 * Generate and compile SVG's
 *
 * @repo    - https://github.com/govau/pancake
 * @author  -  Michael Arthur
 * @license - https://raw.githubusercontent.com/govau/pancake/master/LICENSE (MIT)
 *
 **************************************************************************************************************************************************************/


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
import Path from 'path';
import fs from 'fs';
import SVGSpriter from 'svg-sprite';
import { from as svgToImgFrom } from 'svg-to-img';
import {promisify} from 'util';
const readdir = promisify(fs.readdir);

//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Included modules
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
import { Log, ReadFile, WriteFile, CreateDir } from '@gov.au/pancake';


export const SvgToPng = async (svgs, location) => {
	await CreateDir(location);

	svgs.map(async svg => {
		const png = await ReadFile( svg, { encoding: 'utf-8' } );
		svgToImgFrom(png).to({
			type: 'png',
			path: Path.join(location, Path.basename(svg, '.svg') + '.png')
		});
	});
};


export const CompileAllSvgs = ( compiledAll, SettingsSVG, pkgPath ) => {
	return new Promise( ( resolve, reject ) => {
		Promise.all( compiledAll )
			.catch( error => {
				Log.error(`SVG: Compiling SVG ran into an error: ${ error }`);
			})
			.then(async ( svgModulePath ) => {

			//get all svgs
			const svglist = await readdir( `${svgModulePath}` );                              //read all files in the svg folder
			const svgs = svglist.filter( name => !name.startsWith('.') )                        //let’s hide hidden files
				.map( name => Path.normalize(`${ svgModulePath }/${ name }`) ); //making them absolute paths

			//convert svg to png
			if( SettingsSVG.pngs !== false ) {
				Log.verbose(`SVG: Converting svgs to PNGs`);

				const location = Path.normalize(`${ pkgPath }/${ SettingsSVG.pngs }/`);

				SvgToPng( svgs, location );

			}

			//create svg sprite
			if( SettingsSVG.name !== false ) {

				const location = Path.normalize(`${ pkgPath }/${ SettingsSVG.location }/`);

				const spriter = new SVGSpriter({
					dest: location,
					log: null, // Logging verbosity (default: no logging),
					shape: { // SVG shape related options
						id: { // SVG shape ID related options
							separator: '--', // Separator for directory name traversal
							generator: (name) => (name.split('.')[0]), // SVG shape ID generator callback
							pseudo: '~' // File name separator for shape states (e.g. ':hover')
						},
						transform: ['svgo'], // List of transformations / optimizations
						meta: null, // Path to YAML file with meta / accessibility data
						align: null, // Path to YAML file with extended alignment data
						dest: 'opt' // Output directory for optimized intermediate SVG shapes
					},
					svg: { // General options for created SVG files
						xmlDeclaration: true, // Add XML declaration to SVG sprite
						doctypeDeclaration: true, // Add DOCTYPE declaration to SVG sprite
						namespaceIDs: true, // Add namespace token to all IDs in SVG shapes
						namespaceClassnames: true, // Add namespace token to all CSS class names in SVG shapes
						dimensionAttributes: true // Width and height attributes on the sprite
					},
					variables: {}, // Custom Mustache templating variables and functions
					mode: {
						symbol: {
							sprite: SettingsSVG.name,
						},
						shapes: false
					}
				});
				Log.verbose(`SVG: Adding sprites to the sprite machine`);
				svgs.map(svg => {
					spriter.add( svg, null, fs.readFileSync( svg, { encoding: 'utf-8' } ) );
				});

				Log.verbose(`SVG: Compile sprites into spritesheet`);
				spriter.compile( async ( error, result ) => {
					if( error ) {
						Log.error( error );
						return reject( error );
					}

					for (let mode in result) {
						for (let resource in result[mode]) {
							await WriteFile(result[mode][resource].path, result[mode][resource].contents);
						}
					}

					resolve( true );


				});
			}
		});
	});
};
