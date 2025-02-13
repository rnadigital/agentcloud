import Image from 'next/image';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from 'modules/components/ui/table';
import { Badge } from 'modules/components/ui/badge';
import { Button } from 'modules/components/ui/button';
import { Trash2 } from 'lucide-react';

import { SessionJSONReturnType } from 'controllers/session';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { SessionStatus } from 'struct/session';
import cn from 'utils/cn';
import { useRouter } from 'next/router';
import { Card, CardContent } from 'modules/components/ui/card';
import useResponsive from 'hooks/useResponsive';

interface SessionTableProps {
	sessions: SessionJSONReturnType['sessions'];
	onDelete: (sessionId: string) => void;
}

export function SessionTable({ sessions, onDelete }: SessionTableProps) {
	const router = useRouter();
	const resourceSlug = router.query.resourceSlug as string;
	const { isDesktop } = useResponsive();
	if (!isDesktop) {
		return (
			<div className='space-y-4 mt-2'>
				{sessions.map(session => (
					<Card
						key={session._id.toString()}
						className='cursor-pointer'
						onClick={() => router.push(`/${resourceSlug}/session/${session._id}`)}
					>
						<CardContent className='pt-6'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									{session.app.type === 'chat' ? (
										<ChatBubbleLeftRightIcon width={20} className='text-gray-800' />
									) : (
										<Image src='/process.svg' width={15} height={15} alt='user' />
									)}
									<div>
										<div className='font-medium'>{session.name || 'Unnamed Session'}</div>
										<div className='text-xs text-muted-foreground'>
											{new Date(session.startDate).toLocaleString()}
										</div>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<Badge
										className={cn(
											'px-3 py-1',
											session.status === SessionStatus.RUNNING &&
												'bg-green-100 text-green-800 hover:bg-green-100',
											session.status === SessionStatus.STARTED &&
												'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
											session.status === SessionStatus.TERMINATED &&
												'bg-gray-100 text-gray-800 hover:bg-gray-100'
										)}
									>
										<div className='flex items-center gap-2'>
											{session.status === SessionStatus.RUNNING
												? 'Live'
												: session.status === SessionStatus.STARTED
													? 'Processing'
													: 'Terminated'}
										</div>
									</Badge>
									<Button
										variant='ghost'
										size='icon'
										onClick={e => {
											e.stopPropagation();
											onDelete?.(session._id.toString());
										}}
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
							</div>

							<div className='mt-4 grid grid-cols-2 gap-4'>
								<div>
									<div className='text-sm text-muted-foreground'>Initiated By</div>
									<div>Team Member</div>
									<div className='text-xs text-muted-foreground'>
										{session.sharingConfig.mode.toUpperCase()}
									</div>
								</div>
								<div>
									<div className='text-sm text-muted-foreground'>Tokens Used</div>
									<div>{session.tokensUsed}</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className='rounded-lg shadow mt-2'>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='px-4'>TYPE</TableHead>
						<TableHead>APP</TableHead>
						<TableHead>INITIATED BY</TableHead>
						<TableHead>SESSION ID</TableHead>
						<TableHead>TOKENS USED</TableHead>
						<TableHead>STATUS</TableHead>
						<TableHead className='px-4'>ACTION</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className='bg-white'>
					{sessions.map(session => (
						<TableRow
							key={session._id.toString()}
							onClick={() => router.push(`/${resourceSlug}/session/${session._id}`)}
							className='cursor-pointer'
						>
							<TableCell className='px-4'>
								{session.app.type === 'chat' ? (
									<ChatBubbleLeftRightIcon width={20} className='text-gray-800' />
								) : (
									<Image src='/process.svg' width={15} height={15} alt='user' />
								)}
							</TableCell>
							<TableCell>
								{session.name || 'Unnamed Session'}
								<div className='text-xs text-muted-foreground'>
									{new Date(session.startDate).toLocaleString()}
								</div>
							</TableCell>
							<TableCell>
								Team Member
								<div className='text-xs text-muted-foreground'>
									{session.sharingConfig.mode.toUpperCase()}
								</div>
							</TableCell>
							<TableCell>{session._id.toString()}</TableCell>
							<TableCell>{session.tokensUsed}</TableCell>
							<TableCell>
								<Badge
									className={cn(
										'w-full text-center',
										session.status === SessionStatus.RUNNING &&
											'bg-green-100 text-green-800 hover:bg-green-100',
										session.status === SessionStatus.STARTED &&
											'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
										session.status === SessionStatus.TERMINATED &&
											'bg-gray-100 text-gray-800 hover:bg-gray-100'
									)}
								>
									<div className='flex items-center justify-center gap-2'>
										{session.status === SessionStatus.RUNNING && (
											<svg
												viewBox='0 0 24 24'
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
											>
												<path d='M5 3l14 9-14 9V3z' strokeWidth={2} />
											</svg>
										)}
										{session.status === SessionStatus.STARTED && (
											<svg className='w-4 h-4 animate-spin' viewBox='0 0 24 24' fill='none'>
												<circle
													className='opacity-25'
													cx='12'
													cy='12'
													r='10'
													stroke='currentColor'
													strokeWidth='4'
												/>
												<path
													className='opacity-75'
													fill='currentColor'
													d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
												/>
											</svg>
										)}
										{session.status === SessionStatus.TERMINATED && (
											<svg
												viewBox='0 0 24 24'
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
											>
												<circle cx='12' cy='12' r='10' strokeWidth={2} />
											</svg>
										)}
										{session.status === SessionStatus.RUNNING
											? 'Live'
											: session.status === SessionStatus.STARTED
												? 'Processing'
												: 'Terminated'}
									</div>
								</Badge>
							</TableCell>
							<TableCell>
								<div className='flex items-center gap-2'>
									<Button
										variant='ghost'
										size='icon'
										onClick={e => {
											e.stopPropagation();
											onDelete?.(session._id.toString());
										}}
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
