import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import * as historyModule from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import { Router } from 'react-router';


//import App from './App';

const browserHistory = historyModule.createBrowserHistory();

import stores from './stores/index';
import Base from './pages/Base';

const history = syncHistoryWithStore(browserHistory, stores.routing);

console.log("chat app version: 1.0.7");

ReactDOM.render(   
    <Provider {...stores}>
        <Router history={history}>
            <Base store={stores} />
        </Router>
    </Provider>
    ,
    document.getElementById('root')
);
