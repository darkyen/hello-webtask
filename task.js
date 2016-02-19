import WebTask from 'webtask-tools';
import app from './app';

// this has to be this way, can't use 
// exports just yet.
export default WebTask.fromExpress(app);