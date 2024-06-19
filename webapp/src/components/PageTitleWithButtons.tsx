import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from './shared/Button';

interface ButtonConfig {
	onClick?: () => void;
	buttonText?: string;
	href?: string;
	variant?: 'solid' | 'outline';
	icon?: JSX.Element;
}

interface PageTitleWithButtonsProps {
	buttons?: ButtonConfig[];
	title?: string;
}

export default function PageTitleWithButtons({ buttons, title }: PageTitleWithButtonsProps) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { account } = accountContext;
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;

	return (
		<div className='border-b pb-2 my-2 dark:border-slate-600 flex justify-between'>
			<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>{title}</h3>
			<div className='ml-auto flex space-x-2'>
				{buttons?.map((button, index) => {
					const buttonElement = <Button

						key={index}
						onClick={button.onClick}
						type='button'
						icon={button.icon}
						buttonText={button.buttonText}
						variant={button.variant}
					>

					</Button>

					return button.href ? (
						<Link key={index} href={`/${resourceSlug}${button.href}`}>
							{buttonElement}
						</Link>
					) : (
						buttonElement
					);
				})}
			</div>
		</div>
	);
}