import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import { history } from './Router/AppRouter';

import configStore from './store/configStore';

import {addSignupPrompt} from './actions/prompt';
import {startInitSession} from './actions/pomodoroSessions';
import {startSetTasks} from './actions/tasks';
import {startInitConfig} from './actions/config';
import {logout,login} from './actions/auth';
import Loading from './Components/Loading';

import './firebase/firebase';
import {firebase, storageRef} from './firebase/firebase';

import './styles/styles.scss';
import './styles/base/normalize.css';


//When the app is still loading....
ReactDOM.render(<Loading/>, document.getElementById('root'));


//============lazy-loading============
const Canvas = React.lazy(() => import('./Components/Canvas'));


const store = configStore();

let initAppForUser;
import('moment').then((moment) => {
    initAppForUser = (cred) => {
        console.log("rerendering")
        //===============REDUNDANT CODE====================
        store.dispatch(login('LOGIN',cred));
    
        store.dispatch(startInitSession(moment().format('DD:MM:YYYY')));
        store.dispatch( startSetTasks()).then(() => {
            store.dispatch( startInitConfig()).then(() =>{
                renderApp();
                history.push('/focus');
            });
        });
    }
    
});

const jsx = (
    <Suspense fallback={<Loading/>}>
        <Provider store={store}>
            <Canvas/>
        </Provider>
    </Suspense> 
)


let hasRendered  = false;
const renderApp = () => {
    if(!hasRendered){
        ReactDOM.render(jsx, document.getElementById('root'));
        hasRendered = true;
    }
}

//setting up data for first time/*


firebase.auth().onAuthStateChanged( (user) => {
    if(user){
        console.log('change user state')
        if(user.displayName){
            //after signup there is no displayName so this if handles that
            if(!user.photoURL){//users with email signup have to reteive img from store for them
                //getting image from store and setting to state
                storageRef.ref(`${user.uid}`).getDownloadURL().then(url =>{
                    let cred  = {
                        name: user.displayName,
                        photoUrl: url,
                        uid: user.uid
                    }
                    initAppForUser(cred);
                });
                
            }else{

                let cred  = {
                    name: user.displayName,
                    photoUrl: user.photoURL,
                    uid: user.uid
                };
                initAppForUser(cred);
            }
            
        }else{
            store.dispatch(addSignupPrompt());

            //after signup firebase auto logs in which i don't want
            firebase.auth().signOut();
            renderApp();
            history.push('/');
        }
    }else{
        store.dispatch(logout());
        renderApp();
        history.push('/');
    }
});

console.log(store.getState(),"=====++");



