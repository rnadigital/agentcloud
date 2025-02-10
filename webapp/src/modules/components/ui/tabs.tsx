'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import cn from 'utils/cn';

const Tabs = TabsPrimitive.Root;

const TabsListVariants = cva('inline-flex items-center justify-start h-9', {
	variants: {
		variant: {
			default: 'rounded-lg bg-muted p-1',
			underline: 'border-b rounded-none bg-background gap-2 p-0'
		},
		size: {
			default: 'h-9',
			sm: 'h-8 text-xs',
			lg: 'h-10',
			icon: 'h-9 w-9'
		},
		width: {
			default: 'w-full',
			fit: 'w-fit'
		}
	},
	defaultVariants: {
		variant: 'default',
		size: 'default',
		width: 'default'
	}
});

const TabsTriggerVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap text-sm font-normal transition-all disabled:pointer-events-none data-[state=active]:text-[#2F2A89] data-[state=active]:border-[#2F2A89] px-0.5 font-medium',
	{
		variants: {
			variant: {
				default:
					'data-[state=active]:bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:shadow disabled:opacity-50 rounded-md py-1',
				underline:
					'bg-background border-b-2 rounded-none border-transparent focus:border-primary ring-0 outline-none shadow-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2F2A89] disabled:opacity-100 data-[state=active]:shadow-none m-0 pt-1.5 pb-1 hover:bg-background-muted mr-3'
			},
			size: {
				default: '',
				sm: 'text-xs',
				lg: '',
				icon: 'h-9 w-9'
			},
			width: {
				default: 'w-full',
				fit: 'w-fit'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
			width: 'default'
		}
	}
);

export interface TabsListProps
	extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
		VariantProps<typeof TabsListVariants> {
	asChild?: boolean;
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
	({ className, variant, size, width, ...props }, ref) => (
		<TabsPrimitive.List
			ref={ref}
			className={cn(TabsListVariants({ variant, size, width, className }))}
			{...props}
		/>
	)
);
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
	extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
		VariantProps<typeof TabsTriggerVariants> {
	asChild?: boolean;
}

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	TabsTriggerProps
>(({ className, variant, size, width, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(TabsTriggerVariants({ variant, size, width, className }))}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
			className
		)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
