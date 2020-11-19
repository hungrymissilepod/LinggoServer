import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Cheats from '../cheats/Cheats';

export const Routes = () => {
    return (
        <section className='container'>
            <Switch>
                <Route exact path='/cheats' component={Cheats} />
            </Switch>
        </section>
    );
};

export default Routes;