import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// We use clsx to conditionally join class names together and twMerge to merge Tailwind CSS classes with conflict resolution.
const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs));
};

export default cn;
