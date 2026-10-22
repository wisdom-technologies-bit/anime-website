import { News } from "@/app/ts/interfaces/newsInterface";
import Axios from "axios";

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  // GET ALL NEWS, OR NEWS BY TOPIC
  getNews: async ({ topic }: { topic?: string }) => {
    if (!NEXT_PUBLIC_BACKEND_URL) return [];

    try {
      const { data } = await Axios({
        url: `${NEXT_PUBLIC_BACKEND_URL}/news/consumet/ann/all`,
        method: "GET",
        params: { topic },
      });

      return (data.result ?? []) as News[];
    } catch (err) {
      console.error("Unable to fetch news:", err);
      return [];
    }
  },

  // GET NEWS ARTICLE BY ID
  getNewsInfo: async ({ id }: { id: string }) => {
    if (!NEXT_PUBLIC_BACKEND_URL) return null;

    try {
      const { data } = await Axios({
        url: `${NEXT_PUBLIC_BACKEND_URL}/news/consumet/ann?id=${id}`,
        method: "GET",
      });

      return data.result as News;
    } catch (err) {
      console.error(err);

      return err;
    }
  },
};
