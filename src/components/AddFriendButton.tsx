"use client";

import { FC, useState } from "react";
import Button from "./ui/Button";
import { addFriendValidator } from "@/lib/validations/add-friends";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { set, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface AddFriendButtonProps {}

//validating type:email
type AddFriendFormType = z.infer<typeof addFriendValidator>;

const AddFriendButton: FC<AddFriendButtonProps> = ({}) => {
  const [showSucessState, setShowSucessState] = useState<boolean>(false);
  const [inputEmail, setInputEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    reset,
  } = useForm<AddFriendFormType>({
    resolver: zodResolver(addFriendValidator),
  });

  const addFriend = async (email: string) => {
    try {
      const validatedEmail = addFriendValidator.parse({ email });

      await axios.post("/api/friends/add", {
        email: validatedEmail,
      });

      setShowSucessState(true);
      setInputEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError("email", { message: error.message });
        console.log(error.message);
        return;
      }

      if (error instanceof AxiosError) {
        setError("email", { message: error.response?.data || error.message });
        return;
      }

      setError("email", { message: "something Went Wrong" });
    }
  };

  const onSubmit = (data: AddFriendFormType) => {
    addFriend(data.email);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm">
      <label
        htmlFor="email"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Add Friend by Email
      </label>

      <div className="mt-2 flex gap-4">
        <input
          {...register("email")}
          type="text"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="you@example.com"
        />
        <Button>Add</Button>
      </div>
      <p className="mt-1 text-sm text-red-600">{errors.email?.message}</p>
      {showSucessState && (
        <p className="mt-1 text-sm text-green-600">Friend Request Sent</p>
      )}
    </form>
  );
};

export default AddFriendButton;
