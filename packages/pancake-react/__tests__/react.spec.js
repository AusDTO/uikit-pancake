/***************************************************************************************************************************************************************
 *
 * pancake.js unit tests
 *
 * @file - pancake-js/src/pancake.js
 *
 **************************************************************************************************************************************************************/

import HandleReact from '../src/react.js';
import Path from 'path';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// HandleJS function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------

const from = Path.normalize(`${ __dirname }/../../../tests/test10/node_modules/@gov.au/testmodule1/lib/react/module.js`);
const to = Path.normalize(`${ __dirname }/../../../tests/test10/pancake/react/testmodule1.js`);

test('pancake-react should copy the file and rename it from specified path', () => {
	expect( from ).toBe( to );
});
