

export const logger = (type = 'info', message: string) => {
    if (__DEV__) {
        if (message !== "") {
            console.log(type, message);
        } else {
            console.log(type);
        }
    }
}


export const validEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

export const validPassword = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

export const validName = (name: string): boolean => {
    const regex = /^[a-zA-Z ]{3,}$/;
    return regex.test(name);
}
