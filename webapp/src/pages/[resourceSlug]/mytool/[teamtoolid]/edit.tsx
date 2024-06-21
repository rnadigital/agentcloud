import InstallToolForm from "components/tools/InstallToolForm"

const EditTeamTool = () => {
    return (
        <InstallToolForm apiKeyNames={["SERP_API_KEY", "TAVILY_API_KEY"]} />
    )
}

export default EditTeamTool