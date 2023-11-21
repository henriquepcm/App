import {getActionFromState} from '@react-navigation/core';
import {NavigationAction, NavigationContainerRef, NavigationState} from '@react-navigation/native';
import _ from 'lodash';
import CONST from '@src/CONST';
import NAVIGATORS from '@src/NAVIGATORS';
import {RootStackParamList} from '@src/types/modules/react-navigation';
import getStateFromPath from './getStateFromPath';
import getTopmostReportId from './getTopmostReportId';
import linkingConfig from './linkingConfig';

/**
 * Motivation for this function is described in NAVIGATION.md
 *
 * @param action action generated by getActionFromState
 * @param state The root state
 * @returns minimalAction minimal action is the action that we should dispatch
 */
function getMinimalAction(action: NavigationAction, state: NavigationState<RootStackParamList>): NavigationAction {
    let currentAction = action;
    let currentState = state;
    let currentTargetKey = null;

    while (currentState.routes[currentState.index].name === currentAction?.payload?.name) {
        if (!currentState.routes[currentState.index].state) {
            break;
        }

        currentState = currentState.routes[currentState.index].state;

        currentTargetKey = currentState.key;

        // Creating new smaller action
        currentAction = {
            type: currentAction.type,
            payload: {
                name: currentAction.payload.params.screen,
                params: currentAction.payload.params.params,
                path: currentAction.payload.params.path,
            },
            target: currentTargetKey,
        };
    }
    return currentAction;
}

export default function linkTo(navigation: NavigationContainerRef<RootStackParamList> | null, path: string, type?: string) {
    if (navigation === undefined || navigation === null) {
        throw new Error("Couldn't find a navigation object. Is your component inside a screen in a navigator?");
    }

    let root = navigation;
    let current;

    // Traverse up to get the root navigation
    // eslint-disable-next-line no-cond-assign
    while ((current = root.getParent())) {
        root = current;
    }

    const state = getStateFromPath(path);

    const action = getActionFromState(state, linkingConfig.config);

    // If action type is different than NAVIGATE we can't change it to the PUSH safely
    if (action?.type === CONST.NAVIGATION.ACTION_TYPE.NAVIGATE) {
        // In case if type is 'FORCED_UP' we replace current screen with the provided. This means the current screen no longer exists in the stack
        if (type === CONST.NAVIGATION.TYPE.FORCED_UP) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.REPLACE;

            // If this action is navigating to the report screen and the top most navigator is different from the one we want to navigate - PUSH the new screen to the top of the stack
        } else if (action.payload.name === NAVIGATORS.CENTRAL_PANE_NAVIGATOR && getTopmostReportId(root.getState()) !== getTopmostReportId(state)) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.PUSH;

            // If the type is UP, we deeplinked into one of the RHP flows and we want to replace the current screen with the previous one in the flow
            // and at the same time we want the back button to go to the page we were before the deeplink
        } else if (type === CONST.NAVIGATION.TYPE.UP) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.REPLACE;

            // If this action is navigating to the RightModalNavigator and the last route on the root navigator is not RightModalNavigator then push
        } else if (action.payload.name === NAVIGATORS.RIGHT_MODAL_NAVIGATOR && _.last(root.getState().routes).name !== NAVIGATORS.RIGHT_MODAL_NAVIGATOR) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.PUSH;
        }
    }

    if (action?.payload.name === NAVIGATORS.RIGHT_MODAL_NAVIGATOR) {
        const minimalAction = getMinimalAction(action, navigation.getRootState());
        if (minimalAction) {
            root.dispatch(minimalAction);
            return;
        }
    }

    if (action !== undefined) {
        root.dispatch(action);
    } else {
        root.reset(state);
    }
}
