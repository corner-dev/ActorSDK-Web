/*
 * Copyright (C) 2015 Actor LLC. <https://actor.im>
 */

import { dispatch, dispatchAsync } from '../dispatcher/ActorAppDispatcher';
import { ActionTypes } from '../constants/ActorAppConstants';

import ActorClient from '../utils/ActorClient';
import RouterContainer from '../utils/RouterContainer';

import MyProfileActionCreators from '../actions/MyProfileActionCreators';
import DialogActionCreators from '../actions/DialogActionCreators';
import ContactActionCreators from '../actions/ContactActionCreators';

const LoginActionCreators = {
  changeLogin(login) {
    dispatch(ActionTypes.AUTH_CHANGE_LOGIN, { login })
  },
  changeCode(code) {
    dispatch(ActionTypes.AUTH_CHANGE_CODE, { code })
  },
  changeName(name) {
    dispatch(ActionTypes.AUTH_CHANGE_NAME, { name })
  },

  requestSms(phone) {
    dispatchAsync(ActorClient.requestSms(phone), {
      request: ActionTypes.AUTH_CODE_REQUEST,
      success: ActionTypes.AUTH_CODE_REQUEST_SUCCESS,
      failure: ActionTypes.AUTH_CODE_REQUEST_FAILURE
    }, { phone });
  },
  sendCode(code) {
    const sendCodePromise = () => dispatchAsync(ActorClient.sendCode(code), {
      request: ActionTypes.AUTH_CODE_SEND,
      success: ActionTypes.AUTH_CODE_SEND_SUCCESS,
      failure: ActionTypes.AUTH_CODE_SEND_FAILURE
    }, { code });

    const handleState = (state) => {
      switch (state) {
        case 'signup':
          this.startSignup();
          break;
        case 'logged_in':
          this.setLoggedIn({redirect: true});
          break;
        default:
          console.error('Unsupported state', state);
      }
    };

    sendCodePromise()
      .then(handleState);
  },

  startSignup() {
    dispatch(ActionTypes.AUTH_SIGNUP_START);
  },
  sendSignup(name) {
    const signUpPromise = () => dispatchAsync(ActorClient.signUp(name), {
      request: ActionTypes.AUTH_SIGNUP,
      success: ActionTypes.AUTH_SIGNUP_SUCCESS,
      failure: ActionTypes.AUTH_SIGNUP_FAILURE
    }, { name });

    const setLoggedIn = () => this.setLoggedIn({redirect: true});

    signUpPromise()
      .then(setLoggedIn)
  },

  setLoggedIn: (opts) => {
    opts = opts || {};

    if (opts.redirect) {
      const router = RouterContainer.get();
      const nextPath = router.getCurrentQuery().nextPath;

      if (nextPath) {
        router.replaceWith(nextPath);
      } else {
        router.replaceWith('/');
      }
    }

    dispatch(ActionTypes.AUTH_SET_LOGGED_IN);

    ActorClient.bindUser(ActorClient.getUid(), MyProfileActionCreators.onProfileChanged);

    ActorClient.bindDialogs(DialogActionCreators.setDialogs);

    ActorClient.bindContacts(ContactActionCreators.setContacts);
  },
  setLoggedOut: () => {
    dispatch(ActionTypes.AUTH_SET_LOGGED_OUT);
    ActorClient.unbindUser(ActorClient.getUid(), MyProfileActionCreators.onProfileChanged);

    ActorClient.unbindDialogs(DialogActionCreators.setDialogs);

    ActorClient.unbindContacts(ContactActionCreators.setContacts);
  },

  restartAuth: () => dispatch(ActionTypes.AUTH_RESTART)
};

export default LoginActionCreators;
