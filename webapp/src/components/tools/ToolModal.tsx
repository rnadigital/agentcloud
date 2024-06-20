
import { Dialog, DialogPanel, Transition } from '@headlessui/react'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
import Button from 'components/shared/Button';

interface ToolModalProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ToolModal = ({ open, setOpen }: ToolModalProps) => {

    return (
        <>
            <Transition
                show={open}
                enter="duration-200 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="duration-300 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
                    <div className="fixed inset-0 flex w-screen items-center justify-center sm:p-4 bg-gray-500/75 transition-opacity">
                        <DialogPanel className="max-w-lg border bg-white px-4 sm:px-12 pt-12 h-full sm:rounded-lg shadow-xl flex flex-col items-center relative overflow-auto space-y-4 pb-20">

                            <img src="https://picsum.photos/100" alt="logo" className='rounded-full' />
                            <div className='text-2xl font-bold'>Search LinkedIn</div>
                            <div>By Agent Cloud</div>

                            <section className='flex flex-col sm:flex-row w-full items-center'>
                                <div className='text-center w-1/2 sm:border-r border-gray-300'>
                                    <div className='text-lg font-semibold'>Productivity</div>
                                    <div className='text-sm'>Category</div>
                                </div>
                                <div className='my-2 border-b border-gray-500 sm:hidden w-24' />
                                <div className='text-center w-1/2 sm:border-t-0 sm:border-l bordery-gray-300'>
                                    <div className='text-lg font-semibold'>5k+</div>
                                    <div className='text-sm'>Installs</div>
                                </div>
                            </section>

                            <section className='w-full flex justify-center gap-3'>
                                <div className='flex items-center gap-1'>
                                    <HandThumbUpIcon className='h-8 w-8 border border-gray-700 rounded-full p-1' />
                                    <div>5k</div>
                                </div>

                                <div className='flex items-center gap-1'>
                                    <HandThumbDownIcon className='h-8 w-8 p-1 border border-gray-700 rounded-full' />
                                    <div>2k</div>
                                </div>
                            </section>

                            <section className='w-full'>
                                <div className='font-semibold'>Use Cases</div>
                                <ul>
                                    <li className='list-disc ml-10'>Scrape job postings</li>
                                    <li className='list-disc ml-10'>Scrape company profiles</li>
                                    <li className='list-disc ml-10'>Scrape user profiles</li>
                                </ul>

                            </section>

                            <p>This tool allows you to search LinkedIn for professional profiles. It uses AI to parse the search results and return the most relevant profiles. It can be used to find potential job candidates, business partners, or industry experts.</p>


                            <p>This tool allows you to search LinkedIn for professional profiles. It uses AI to parse the search results and return the most relevant profiles. It can be used to find potential job candidates, business partners, or industry experts.</p>
                            <p>This tool allows you to search LinkedIn for professional profiles. It uses AI to parse the search results and return the most relevant profiles. It can be used to find potential job candidates, business partners, or industry experts.</p>


                        </DialogPanel>

                        <div className='absolute bottom-0 w-full max-w-lg px-2 bg-white'>
                            <Button onClick={() => setOpen(false)} buttonText='Install' className='w-full justify-center h-12 mb-4' />
                        </div>
                    </div >
                </Dialog >

            </Transition >
        </>
    )
}

export default ToolModal;