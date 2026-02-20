import axios from "axios";
export const LoginAction = async (cin: string, password: string) => {
  try {
    const res = await axios.post(`${process.env.LOGIN_API_URL}/login`, {
      cin,
      password,
    });

    console.log(`${process.env.LOGIN_API_URL}/login`,"ppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp")
    if (res.status === 200) {
      const expires = new Date(Date.now() + 1000 * 1000 * 1000);

      cookieStore.set("session", res.data.token);
      return Promise.resolve({ status: res.status, data: res.data.message });
    }
  } catch (error: any) {
    console.error("Login error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response.status,
      data: error?.response?.data?.message,
    }); 
  }
};
