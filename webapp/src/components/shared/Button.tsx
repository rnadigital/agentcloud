import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'solid' | 'outline' | 'cancel';
    buttonText?: string;
    icon?: JSX.Element;
}

const baseClasses = 'inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

const variantClasses = {
    solid: 'bg-indigo-500 text-white hover:bg-indigo-600 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700',
    outline: 'border border-indigo-500 text-indigo-500 hover:bg-indigo-50 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:text-gray-700',
    cancel: 'border border-red-500 text-red-500 hover:bg-red-50 focus-visible:outline-red-600 disabled:border-gray-300 disabled:text-gray-700'
};

const Button = ({ variant = 'solid', buttonText, icon, className, ...props }: ButtonProps) => {

    return (
        <button className={clsx(baseClasses, variantClasses[variant], className)} {...props}>
            {icon && <span className='-ml-0.5 mr-1.5 h-5 w-5'>{icon}</span>}
            {buttonText}
        </button>
    );
};

export default Button;