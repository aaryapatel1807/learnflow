import * as React from "react";
import { useState, useId } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Typewriter } from "./typewriter";
import { IconCloud } from "./interactive-icon-cloud";

function formatAuthError(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
    const message = (err as { message?: string }).message;
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/50 bg-white/25 px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 backdrop-blur-sm transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-white/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.07] dark:focus-visible:bg-white/[0.12]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10 pl-11", className)} ref={ref} {...props} />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

interface FormState {
  loading: boolean;
  error: string;
}

function useAuthForm(submit: () => Promise<void>): [FormState, (e: React.FormEvent<HTMLFormElement>) => void] {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await submit();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };
  return [{ loading, error }, handleSubmit];
}

function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}

function SignInForm({ onSignIn }: { onSignIn: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [{ loading, error }, handleSubmit] = useAuthForm(() => onSignIn(email, password));

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-white/50 bg-white/25 text-lg font-bold text-primary shadow-sm backdrop-blur-sm dark:border-white/15 dark:bg-white/10 dark:text-white">
          L
        </div>
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your email below to sign in</p>
      </div>
      <div className="grid gap-5">
        <AuthError message={error} />
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" />
          </div>
        </div>
        <PasswordInput name="password" label="Password" required autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" variant="default" className="mt-2 shadow-lg shadow-primary/25 dark:bg-white dark:text-[#1b1030] dark:shadow-[0_12px_35px_-10px_rgba(255,255,255,0.45)] dark:hover:bg-white/90" disabled={loading}>
          {loading ? "Signing in…" : (<>Sign In <ArrowRight /></>)}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm({ onSignUp }: { onSignUp: (name: string, email: string, password: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [{ loading, error }, handleSubmit] = useAuthForm(() => onSignUp(name, email, password));

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-white/50 bg-white/25 text-lg font-bold text-primary shadow-sm backdrop-blur-sm dark:border-white/15 dark:bg-white/10 dark:text-white">
          L
        </div>
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your details below to sign up</p>
      </div>
      <div className="grid gap-5">
        <AuthError message={error} />
        <div className="grid gap-1">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" name="name" type="text" placeholder="John Doe" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-11" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" />
          </div>
        </div>
        <PasswordInput name="password" label="Password" required minLength={6} autoComplete="new-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" variant="default" className="mt-2 shadow-lg shadow-primary/25 dark:bg-white dark:text-[#1b1030] dark:shadow-[0_12px_35px_-10px_rgba(255,255,255,0.45)] dark:hover:bg-white/90" disabled={loading}>
          {loading ? "Creating account…" : (<>Sign Up <ArrowRight /></>)}
        </Button>
      </div>
    </form>
  );
}

interface AuthFormContainerProps {
  isSignIn: boolean;
  onToggle: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (name: string, email: string, password: string) => Promise<void>;
}

function AuthFormContainer({ isSignIn, onToggle, onSignIn, onSignUp }: AuthFormContainerProps) {
  return (
    <div className="relative mx-auto w-[350px] sm:w-[540px]">
      {/* ambient colour blobs that glow through the frosted card */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-10">
        <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-[#f472a8]/60 blur-3xl dark:bg-[#a855f7]/25" />
        <div className="absolute -bottom-20 -right-14 h-80 w-80 rounded-full bg-[#a78bfa]/60 blur-3xl dark:bg-[#7c3aed]/25" />
        <div className="absolute left-1/4 top-1/3 h-60 w-60 rounded-full bg-[#7dd3c8]/50 blur-3xl dark:bg-[#4c1d95]/20" />
      </div>
      <div className="relative grid gap-5 rounded-[36px] border border-white/50 bg-white/15 px-16 py-10 shadow-[0_24px_70px_-20px_rgba(225,77,122,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_30px_90px_-20px_rgba(147,51,234,0.45)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-36 rounded-t-[36px] bg-gradient-to-b from-white/25 to-transparent" />
        {isSignIn ? <SignInForm onSignIn={onSignIn} /> : <SignUpForm onSignUp={onSignUp} />}
        <div className="text-center text-sm">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
          <Button variant="link" className="pl-1 text-foreground" onClick={onToggle}>
            {isSignIn ? "Sign up" : "Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AuthContentProps {
  quote?: {
    text: string;
    author: string;
  };
}

interface AuthUIProps {
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
  /** Which form shows first. Defaults to true (sign in). */
  initialIsSignIn?: boolean;
  /** Called when the user toggles between forms; parent can navigate instead. */
  onToggleMode?: (isSignIn: boolean) => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (name: string, email: string, password: string) => Promise<void>;
}

const defaultSignInContent = {
  quote: {
    text: "Welcome back. Your learning journey continues.",
    author: "LearnFlow",
  },
};

const defaultSignUpContent = {
  quote: {
    text: "Create your account. A new chapter of learning awaits.",
    author: "LearnFlow",
  },
};

const authIconSlugs = [
  "typescript",
  "javascript",
  "react",
  "nodedotjs",
  "express",
  "nextdotjs",
  "html5",
  "css3",
  "mongodb",
  "postgresql",
  "prisma",
  "docker",
  "git",
  "github",
  "figma",
  "vercel",
  "firebase",
  "jest",
  "visualstudiocode",
  "android",
  "java",
  "python",
];

export function AuthUI({
  signInContent = {},
  signUpContent = {},
  initialIsSignIn = true,
  onToggleMode,
  onSignIn,
  onSignUp,
}: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(initialIsSignIn);

  const toggleForm = () => {
    const next = !isSignIn;
    if (onToggleMode) {
      onToggleMode(next);
    } else {
      setIsSignIn(next);
    }
  };

  const finalSignInContent = {
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,#a855f7_0%,#7e22cc_30%,#3b0764_60%,#0d0716_100%)]">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12">
        <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} onSignIn={onSignIn} onSignUp={onSignUp} />
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#fbe3ec] via-[#f6e7ee] to-[#e9e4f7] md:block dark:bg-none">
        {/* sphere + quote stacked as one group, nudged slightly below centre */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 pt-20">
          <div className="aspect-square w-[min(80%,60vh)]">
            <IconCloud iconSlugs={authIconSlugs} />
          </div>
          <blockquote className="relative mt-6 space-y-2 text-center text-foreground">
            <p className="text-xl font-bold">
              &ldquo;
              <Typewriter
                key={currentContent.quote.text}
                text={currentContent.quote.text}
                speed={60}
              />
              &rdquo;
            </p>
            <cite className="block text-sm font-light text-muted-foreground not-italic">
              — {currentContent.quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
