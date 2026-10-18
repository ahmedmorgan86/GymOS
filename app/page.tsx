import Workspace from "./workspace";
import {requireChatGPTUser} from "./chatgpt-auth";
export const metadata={other:{'gymos-offline-shell':'1'}};
export const dynamic="force-dynamic";
export default async function Home(){await requireChatGPTUser("/");return <Workspace/>;}
