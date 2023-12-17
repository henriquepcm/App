import {createContext} from 'react';
import {RegisterInput} from './types';

type FormContext = {
    registerInput: RegisterInput;
};

export default createContext<FormContext>({
    registerInput: () => {
        throw new Error('Registered input should be wrapped with FormWrapper');
    },
});
