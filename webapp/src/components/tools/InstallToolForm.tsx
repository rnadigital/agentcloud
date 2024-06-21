import React from "react";
import { useForm, Controller } from "react-hook-form";
import InputField from "components/shared/form/InputField";
import Button from "components/shared/Button";
import { useRouter } from "next/router";

interface FormFields {
    name: string
    [key: string]: string;
}

interface MyToolFormProps {
    apiKeyNames: string[];
}

const InstallToolForm = ({ apiKeyNames }: MyToolFormProps) => {
    const { control, handleSubmit } = useForm<FormFields>({
        defaultValues: {
            name: "Search LinkedIn",
        }
    });

    const router = useRouter()

    const onSubmit = (data: FormFields) => {
        router.push(`/${router.query.resourceSlug}/mytools`)
    };

    const onCancel = () => {
        router.back()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <InputField<FormFields>
                name="name"
                label="Tool Name"
                rules={{ required: "This field is required" }}
                type="text"
                control={control}
                disabled
            />
            {apiKeyNames.map((key) => (
                <div key={key}>
                    <InputField<FormFields>
                        name={key}
                        label={key}
                        rules={{ required: "This field is required" }}
                        type="text"
                        control={control}
                    />
                </div>
            ))}
            <div className="flex gap-4">

                <Button type="button" buttonText="Cancel" variant="cancel" onClick={onCancel} />
                <Button type="submit" buttonText="Submit" />
            </div>
        </form>
    );
};

export default InstallToolForm;