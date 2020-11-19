import {
  GET_CHEAT_CODE,
  CHEAT_CODE_ERROR,
} from '../actions/types';

const initialSate = {
  loading: true,
  error: {},
}

export default function (state = initialSate, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_CHEAT_CODE:
      return {
        ...state,
        loading: false,
      };
    case CHEAT_CODE_ERROR:
      return {
        ...state,
        loading: false,
      };
    default: {
      return state;
    }
  }
}