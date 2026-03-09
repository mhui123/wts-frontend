import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import '../styles/components/Register.css';

type FieldErrors = {
	email?: string;
	password?: string;
	name?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;
const nameRegex = /^[A-Za-z가-힣\s]+$/;

const Register: React.FC = () => {
	const navigate = useNavigate();
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [name, setName] = React.useState('');
	const [errors, setErrors] = React.useState<FieldErrors>({});
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const toastTimerRef = React.useRef<number | null>(null);

	const validate = React.useCallback((): FieldErrors => {
		const nextErrors: FieldErrors = {};

		if (!emailRegex.test(email)) {
			nextErrors.email = '이메일 형식으로 입력해 주세요.';
		}

		if (!passwordRegex.test(password)) {
			nextErrors.password = '특수문자 포함 8-20자리로 입력해 주세요.';
		}

		if (!name.trim()) {
			nextErrors.name = '이름을 입력해 주세요.';
		} else if (!nameRegex.test(name)) {
			nextErrors.name = '한글 또는 영어만 입력해 주세요.';
		}

		return nextErrors;
	}, [email, password, name]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const validationErrors = validate();
		setErrors(validationErrors);

		if (Object.keys(validationErrors).length > 0) {
			return;
		}
        

		setIsSubmitting(true);
		try {
			await api.post('/account/register', {
				email,
				password,
				name
			});

			setToast({
				message: '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.',
				type: 'success'
			});

			if (toastTimerRef.current) {
				window.clearTimeout(toastTimerRef.current);
			}

			toastTimerRef.current = window.setTimeout(() => {
				setToast(null);
				navigate('/login');
			}, 1400);
		} catch (error) {
			console.error('회원가입 실패:', error);
			setToast({
				message: '회원가입에 실패했습니다. 입력값을 확인해 주세요.',
				type: 'error'
			});

			if (toastTimerRef.current) {
				window.clearTimeout(toastTimerRef.current);
			}

			toastTimerRef.current = window.setTimeout(() => {
				setToast(null);
			}, 2200);
		} finally {
			setIsSubmitting(false);
		}
	};

	React.useEffect(() => {
		return () => {
			if (toastTimerRef.current) {
				window.clearTimeout(toastTimerRef.current);
			}
		};
	}, []);

	return (
		<div className="register-page">
			{toast && (
				<div className={`register-toast ${toast.type}`} role="status">
					{toast.message}
				</div>
			)}
			<div className="register-box">
				<h1 className="register-title">회원가입</h1>
				<form className="register-form" onSubmit={handleSubmit} noValidate>
					<label className="register-label" htmlFor="register-email">아이디 (이메일)</label>
					<input
						id="register-email"
						className={`register-input ${errors.email ? 'has-error' : ''}`}
						type="email"
						placeholder="name@example.com"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						autoComplete="email"
						required
					/>
					{errors.email && <p className="register-error">{errors.email}</p>}

					<label className="register-label" htmlFor="register-password">비밀번호</label>
					<input
						id="register-password"
						className={`register-input ${errors.password ? 'has-error' : ''}`}
						type="password"
						placeholder="특수문자 포함 8-20자리"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						autoComplete="new-password"
						required
						minLength={8}
						maxLength={20}
					/>
					{errors.password && <p className="register-error">{errors.password}</p>}

					<label className="register-label" htmlFor="register-name">이름</label>
					<input
						id="register-name"
						className={`register-input ${errors.name ? 'has-error' : ''}`}
						type="text"
						placeholder="홍길동"
						value={name}
						onChange={(event) => setName(event.target.value)}
						autoComplete="name"
						required
					/>
					{errors.name && <p className="register-error">{errors.name}</p>}

					<button className="register-submit" type="submit" disabled={isSubmitting}>
						{isSubmitting ? '가입 중...' : '회원가입'}
					</button>
				</form>
				<p className="register-note">
					이미 계정이 있으신가요? <button type="button" onClick={() => navigate('/login')}>로그인</button>
				</p>
			</div>
		</div>
	);
};

export default Register;
