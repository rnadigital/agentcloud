
interface ToolProps {
    name: string;
    imageURL: string;
    description: string;
    creator: string;
    position: number;
    openToolModal: (toolId: string) => void;
}

const Tool = ({ name, imageURL, description, creator, position, openToolModal }: ToolProps) => {

    return (
        <div className='flex items-center h-28 px-2 py-4 rounded-xl hover:bg-gray-100 cursor-pointer' onClick={() => openToolModal(name)}>
            <div className='text-sm'>{position}</div>
            <img src={imageURL} alt="tool" className='rounded-full h-12 w-12 mx-4' />
            <div className='flex flex-col items-start text-left gap-1'>
                <div className='font-medium text-sm text-gray-900'>
                    {name}
                </div>
                <div className='line-clamp-3 text-xs text-gray-800'>
                    {description}
                </div>
                <div className='text-gray-700 text-xs'>
                    By {creator}
                </div>


            </div>
        </div>
    )
}

export default Tool