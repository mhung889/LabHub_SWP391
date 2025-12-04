import React, { useState } from 'react';

export const Login = ({ onLogin = () => {} }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) onLogin();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex flex-1 w-full">
        {/* Left Side - Login Form */}
        <div className="flex flex-1 flex-col justify-center items-center p-8 lg:p-12 bg-white dark:bg-background-dark">
          <div className="flex flex-col w-full max-w-md gap-6">
            {/* Logo Section */}
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-4xl">science</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">LabHub</span>
              </div>
              <h1 className="text-[#111418] dark:text-slate-200 tracking-light text-[32px] font-bold leading-tight">
                Chào mừng trở lại
              </h1>
              <p className="text-[#617589] dark:text-slate-400 text-base font-normal leading-normal">
                Đăng nhập vào hệ thống quản lý của lab.
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email Field */}
              <label className="flex flex-col flex-1">
                <p className="text-[#111418] dark:text-slate-300 text-base font-medium leading-normal pb-2">Email</p>
                <div className="relative flex w-full items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-slate-200 focus:outline-0 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 h-14 placeholder:text-[#617589] dark:placeholder:text-slate-500 pl-12 pr-4 text-base font-normal leading-normal"
                    placeholder="Nhập email của bạn"
                    required
                  />
                </div>
              </label>

              {/* Password Field */}
              <label className="flex flex-col flex-1">
                <p className="text-[#111418] dark:text-slate-300 text-base font-medium leading-normal pb-2">Mật khẩu</p>
                <div className="relative flex w-full items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-slate-200 focus:outline-0 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 h-14 placeholder:text-[#617589] dark:placeholder:text-slate-500 pl-12 pr-12 text-base font-normal leading-normal"
                    placeholder="Nhập mật khẩu của bạn"
                    required
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    className="absolute right-4 text-[#617589] dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={togglePasswordVisibility}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </label>

              {/* Remember & Forgot */}
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="form-checkbox h-4 w-4 rounded text-primary focus:ring-primary/50 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-primary"
                  />
                  <span className="text-sm font-medium text-[#111418] dark:text-slate-300">Ghi nhớ đăng nhập</span>
                </label>
                <a
                  href="#"
                  className="text-primary text-sm font-medium leading-normal underline hover:text-primary/80"
                >
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="flex items-center justify-center rounded-lg bg-primary h-14 px-6 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
              >
                Đăng nhập
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-4 text-sm text-slate-500 dark:text-slate-400">Hoặc đăng nhập với</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 h-12 px-4 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_3033_244)">
                    <path
                      d="M22.0002 12.2727C22.0002 11.4545 21.9275 10.6364 21.782 9.81818H12.0002V14.4545H17.7275C17.5002 15.8182 16.7275 16.9773 15.5457 17.7273V20.2727H19.0911C20.9275 18.5795 22.0002 15.6818 22.0002 12.2727Z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 22C14.9091 22 17.3864 21.0455 19.0909 19.4545L15.5455 16.9091C14.5455 17.6136 13.3636 18 12 18C9.45455 18 7.27273 16.3182 6.54545 14.0909H2.86364V16.6364C4.54545 19.8636 8.00001 22 12 22Z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M6.45455 14.0909C6.22727 13.3864 6.09091 12.6364 6.09091 11.8182C6.09091 11 6.22727 10.25 6.45455 9.54545V7H2.86364C2.31818 8.5 2 10.1364 2 11.8182C2 13.5 2.31818 15.1364 2.86364 16.6364L6.45455 14.0909Z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 6.00001C13.4545 6.00001 14.7273 6.54546 15.7273 7.45455L19.1818 4.00001C17.3864 2.27273 14.9091 1.22728 12 1.22728C8.00001 1.22728 4.54545 3.45455 2.86364 6.68182L6.54545 9.22728C7.27273 6.90909 9.45455 5.22728 12 5.22728V6.00001Z"
                      fill="#EA4335"
                    ></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_3033_244">
                      <rect fill="white" height="20" transform="translate(2 2)" width="20"></rect>
                    </clipPath>
                  </defs>
                </svg>
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 h-12 px-4 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M12 1.25C5.504 1.25 0.25 6.504 0.25 13C0.25 18.254 3.796 22.618 8.656 23.684C9.281 23.798 9.52 23.414 9.52 23.088C9.52 22.792 9.508 21.936 9.502 20.84C6.276 21.574 5.52 19.336 5.52 19.336C4.954 17.892 4.094 17.498 4.094 17.498C2.96 16.704 4.184 16.716 4.184 16.716C5.438 16.804 6.074 18.006 6.074 18.006C7.19 19.894 8.99 19.346 9.554 19.068C9.664 18.272 9.982 17.744 10.334 17.44C7.526 17.126 4.582 16.01 4.582 11.354C4.582 10.038 5.066 8.956 5.846 8.118C5.724 7.804 5.306 6.51 5.966 4.81C5.966 4.81 7.022 4.464 9.5 6.11C10.514 5.826 11.594 5.684 12.674 5.68C13.754 5.684 14.834 5.826 15.848 6.11C18.326 4.464 19.382 4.81 19.382 4.81C20.042 6.51 19.624 7.804 19.502 8.118C20.282 8.956 20.766 10.038 20.766 11.354C20.766 16.022 17.822 17.126 15.002 17.44C15.424 17.81 15.824 18.574 15.824 19.728C15.824 21.436 15.81 22.84 15.81 23.182C15.81 23.512 16.046 23.89 16.682 23.776C21.538 22.614 25.08 18.252 25.08 13C25.08 6.504 19.826 1.25 13.33 1.25H12Z"
                    fillRule="evenodd"
                    transform="translate(-1 -1) scale(0.96)"
                  ></path>
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-background-light dark:bg-slate-900/50 p-8 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover"
              alt="Students collaborating on laptops in a modern, bright workspace."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHrYA-JbjG4qPmzA_osWfbIQDRi42DEh_pchFoqry2W0w1CyNu3CLumo2831UO8ZG_tCO_tdC2_16aAh9hXv9WTtEh12bd4zuJRyfmYSW-VK8ZrlFJMpPU5RlSiipImlOQMLm3LrhoOG4t-k2ovdIR1NJGMAKIyrTc6weYf9hkHFYYybUCapCDt7ZZ-1AkIGvtUjuPFOC6C-ddok3ecH9d8tKXDCVtluONbnYh-5N2D64uoigF4TVZChaiRQfINT85iBsgbPHue6o"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          <div className="relative z-10 max-w-lg text-white text-center">
            <h2 className="text-4xl font-bold leading-tight mb-4">Nơi ý tưởng cất cánh.</h2>
            <p className="text-lg text-slate-200">
              Tham gia cộng đồng của chúng tôi để quản lý, học hỏi và phát triển cùng nhau trong môi trường lab năng động và sáng tạo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};