import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
	WithElementRef as WithElementRefType,
	WithoutChild as WithoutChildType,
	WithoutChildren as WithoutChildrenType,
	WithoutChildrenOrChild as WithoutChildrenOrChildType,
} from 'svelte-toolbelt';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithElementRef<T, U extends HTMLElement = HTMLElement> = WithElementRefType<T, U>;
export type WithoutChild<T> = WithoutChildType<T>;
export type WithoutChildren<T> = WithoutChildrenType<T>;
export type WithoutChildrenOrChild<T> = WithoutChildrenOrChildType<T>;
