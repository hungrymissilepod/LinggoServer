import axios from 'axios';

import {
  GET_CHEAT_CODE,
  CHEAT_CODE_ERROR,
} from './types';

// ! NOT USED
export const getCheatCode = () => async (dispatch) => {
  console.log('hello');
  try {
    const res = await axios.get('/api/cheats');
    console.log(res.data);
    dispatch({
      type: GET_CHEAT_CODE,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: CHEAT_CODE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};