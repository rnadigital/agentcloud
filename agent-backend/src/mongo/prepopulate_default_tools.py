from bson import ObjectId
from pymongo import MongoClient

def add_tool(tool_dict:dict) -> None:
    '''
    Add a tool to the mongo database.
    '''
    cnxn = MongoClient()
    mongo_client = cnxn["test"]
    
    # Upload input_json to mongo
    mongo_client["tools"].insert_one(tool_dict)
    # Disconnect from mongo
    cnxn.close()


def reset_default_tools() -> None:
    '''
    Delete tools present and reset the mongo database with default tools.
    '''
    cnxn = MongoClient()
    mongo_client = cnxn["test"]

    # Delete all existing agents
    mongo_client["tools"].delete_many({})

    # Get all org and team id combinations as a list of tuples (org_id, team_id)
    # 1 org can have multiple teams in teamIds
    # Extract the org id and team id from each org into strings
    org_team_ids = []
    for org in mongo_client["orgs"].find():
        org_id = str(org["_id"])
        for team_id in org["teamIds"]:
            org_team_ids.append((org_id, str(team_id)))
    
    # Iterate and print all org and team id seperated by a space
    for org_team_id in org_team_ids:
        org_id = org_team_id[0]
        team_id = org_team_id[1]

        fetch_profile_dict = {
        "orgId" : ObjectId(org_id),
        "teamId" : ObjectId(team_id),
        "name" : "Fetch Profile",
        "type" : "function",
        "schema" : None,
        "data" : {
            "code" : "from typing import Optional\r\nimport requests\r\nfrom bs4 import BeautifulSoup\r\n\r\n\r\ndef fetch_user_profile(url: str) -> Optional[str]:\r\n    \"\"\"\r\n    Fetches the text content from a personal website.\r\n\r\n    Given a URL of a person's personal website, this function scrapes\r\n    the content of the page and returns the text found within the <body>.\r\n\r\n    Args:\r\n        url (str): The URL of the person's personal website.\r\n\r\n    Returns:\r\n        Optional[str]: The text content of the website's body, or None if any error occurs.\r\n    \"\"\"\r\n    try:\r\n        # Send a GET request to the URL\r\n        response = requests.get(url)\r\n        # Check for successful access to the webpage\r\n        if response.status_code == 200:\r\n            # Parse the HTML content of the page using BeautifulSoup\r\n            soup = BeautifulSoup(response.text, \"html.parser\")\r\n            # Extract the content of the <body> tag\r\n            body_content = soup.find(\"body\")\r\n            # Return all the text in the body tag, stripping leading/trailing whitespaces\r\n            return \" \".join(body_content.stripped_strings) if body_content else None\r\n        else:\r\n            # Return None if the status code isn't 200 (success)\r\n            return None\r\n    except requests.RequestException:\r\n        # Return None if any request-related exception is caught\r\n        return None\r\n",
            "description" : "Fetches the text content from a personal website. \nGiven a URL of a person's personal website, this function scrapes the content of the page and returns the text found within the <body>.",
            "parameters" : {
                "type" : "object",
                "required" : [
                    "url"
                ],
                "properties" : {
                    "url" : {
                        "type" : "string",
                        "description" : "The URL of the person's personal website"
                    }
                }
            },
            "builtin" : False,
            "name" : "fetch_profile"
            }
            }

        add_tool(tool_dict=fetch_profile_dict)

        arxiv_dict = {
        "orgId" : ObjectId(org_id),
        "teamId" : ObjectId(team_id),
        "name" : "Find papers on arXiv",
        "type" : "function",
        "schema" : None,
        "data" : {
            "code" : "import os\r\nimport re\r\nimport json\r\nimport hashlib\r\n\r\n\r\ndef search_arxiv(query, max_results=10):\r\n    \"\"\"\r\n    Searches arXiv for the given query using the arXiv API, then returns the search results. This is a helper function. In most cases, callers will want to use 'find_relevant_papers( query, max_results )' instead.\r\n\r\n    Args:\r\n        query (str): The search query.\r\n        max_results (int, optional): The maximum number of search results to return. Defaults to 10.\r\n\r\n    Returns:\r\n        jresults (list): A list of dictionaries. Each dictionary contains fields such as 'title', 'authors', 'summary', and 'pdf_url'\r\n\r\n    Example:\r\n        >>> results = search_arxiv(\"attention is all you need\")\r\n        >>> print(results)\r\n    \"\"\"\r\n\r\n    import arxiv\r\n\r\n    key = hashlib.md5((\"search_arxiv(\" + str(max_results) + \")\" + query).encode(\"utf-8\")).hexdigest()\r\n    # Create the cache if it doesn't exist\r\n    cache_dir = \".cache\"\r\n    if not os.path.isdir(cache_dir):\r\n        os.mkdir(cache_dir)\r\n\r\n    fname = os.path.join(cache_dir, key + \".cache\")\r\n\r\n    # Cache hit\r\n    if os.path.isfile(fname):\r\n        fh = open(fname, \"r\", encoding=\"utf-8\")\r\n        data = json.loads(fh.read())\r\n        fh.close()\r\n        return data\r\n\r\n    # Normalize the query, removing operator keywords\r\n    query = re.sub(r\"[^\\s\\w]\", \" \", query.lower())\r\n    query = re.sub(r\"\\s(and|or|not)\\s\", \" \", \" \" + query + \" \")\r\n    query = re.sub(r\"[^\\s\\w]\", \" \", query.lower())\r\n    query = re.sub(r\"\\s+\", \" \", query).strip()\r\n\r\n    search = arxiv.Search(query=query, max_results=max_results, sort_by=arxiv.SortCriterion.Relevance)\r\n\r\n    jresults = list()\r\n    for result in search.results():\r\n        r = dict()\r\n        r[\"entry_id\"] = result.entry_id\r\n        r[\"updated\"] = str(result.updated)\r\n        r[\"published\"] = str(result.published)\r\n        r[\"title\"] = result.title\r\n        r[\"authors\"] = [str(a) for a in result.authors]\r\n        r[\"summary\"] = result.summary\r\n        r[\"comment\"] = result.comment\r\n        r[\"journal_ref\"] = result.journal_ref\r\n        r[\"doi\"] = result.doi\r\n        r[\"primary_category\"] = result.primary_category\r\n        r[\"categories\"] = result.categories\r\n        r[\"links\"] = [str(link) for link in result.links]\r\n        r[\"pdf_url\"] = result.pdf_url\r\n        jresults.append(r)\r\n\r\n    if len(jresults) > max_results:\r\n        jresults = jresults[0:max_results]\r\n\r\n    # Save to cache\r\n    fh = open(fname, \"w\")\r\n    fh.write(json.dumps(jresults))\r\n    fh.close()\r\n    return jresults\r\n",
            "description" : "Searches arXiv for the given query using the arXiv API, then returns the search results.",
            "parameters" : {
                "type" : "object",
                "required" : [
                    "query"
                ],
                "properties" : {
                    "query" : {
                        "type" : "string",
                        "description" : "The search query."
                    },
                    "max_results" : {
                        "type" : "integer",
                        "description" : "The maximum number of search results to return. Defaults to 10."
                    }
                }
            },
            "builtin" : False,
            "name" : "arxiv2"
            }
            }
        
        add_tool(tool_dict=arxiv_dict)

        
        generate_image_dict = {
        "_id" : ObjectId("65b9b7f17047009e201dcaad"),
        "orgId" : ObjectId("65b826861c6b30efe9d7509c"),
        "teamId" : ObjectId("65b826861c6b30efe9d7509d"),
        "name" : "Generate images",
        "type" : "function",
        "schema" : None,
        "data" : {
            "code" : "from typing import List\r\nimport uuid\r\nimport requests  # to perform HTTP requests\r\nfrom pathlib import Path\r\n\r\nfrom openai import OpenAI\r\n\r\n\r\ndef generate_and_save_images(query: str, image_size: str = \"1024x1024\") -> List[str]:\r\n    \"\"\"\r\n    Function to paint, draw or illustrate images based on the users query or request. Generates images from a given query using OpenAI's DALL-E model and saves them to disk.  Use the code below anytime there is a request to create an image.\r\n\r\n    :param query: A natural language description of the image to be generated.\r\n    :param image_size: The size of the image to be generated. (default is \"1024x1024\")\r\n    :return: A list of filenames for the saved images.\r\n    \"\"\"\r\n\r\n    client = OpenAI()  # Initialize the OpenAI client\r\n    response = client.images.generate(model=\"dall-e-3\", prompt=query, n=1, size=image_size)  # Generate images\r\n\r\n    # List to store the file names of saved images\r\n    saved_files = []\r\n\r\n    # Check if the response is successful\r\n    if response.data:\r\n        for image_data in response.data:\r\n            # Generate a random UUID as the file name\r\n            file_name = str(uuid.uuid4()) + \".png\"  # Assuming the image is a PNG\r\n            file_path = Path(file_name)\r\n\r\n            img_url = image_data.url\r\n            img_response = requests.get(img_url)\r\n            if img_response.status_code == 200:\r\n                # Write the binary content to a file\r\n                with open(file_path, \"wb\") as img_file:\r\n                    img_file.write(img_response.content)\r\n                    print(f\"Image saved to {file_path}\")\r\n                    saved_files.append(str(file_path))\r\n            else:\r\n                print(f\"Failed to download the image from {img_url}\")\r\n    else:\r\n        print(\"No image data found in the response!\")\r\n\r\n    # Return the list of saved files\r\n    return saved_files\r\n\r\n\r\n# Example usage of the function:\r\n# generate_and_save_images(\"A cute baby sea otter\")\r\n",
            "description" : "Function to paint, draw or illustrate images based on the users query or request. Generates images from a given query using OpenAI's DALL-E model and saves them to disk.  Use the code below anytime there is a request to create an image.",
            "parameters" : {
                "type" : "object",
                "required" : [
                    "query"
                ],
                "properties" : {
                    "query" : {
                        "type" : "string",
                        "description" : "A natural language description of the image to be generated."
                    },
                    "image_size" : {
                        "type" : "string",
                        "description" : "The size of the image to be generated. (default is \"1024x1024\")"
                    }
                }
            },
            "builtin" : False,
            "name" : "generate_images"
            }
            }
        
        add_tool(tool_dict=generate_image_dict)

            
        
