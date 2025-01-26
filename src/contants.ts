import { configDotenv } from "dotenv";
import * as process from "node:process";

configDotenv();

export const vkIdConstants = {
	clientId: +process.env.VKID_CLIENT_ID,
	redirectUri: process.env.VKID_REDIRECT_URI,
	jwtPubKey:
		"-----BEGIN PUBLIC KEY-----\n" +
		"MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAvsvJlhFX9Ju/pvCz1frB\n" +
		"DgJs592VjdwQuRAmnlJAItyHkoiDIOEocPzgcUBTbDf1plDcTyO2RCkUt0pz0WK6\n" +
		"6HNhpJyIfARjaWHeUlv4TpuHXAJJsBKklkU2gf1cjID+40sWWYjtq5dAkXnSJUVA\n" +
		"UR+sq0lJ7GmTdJtAr8hzESqGEcSP15PTs7VUdHZ1nkC2XgkuR8KmKAUb388ji1Q4\n" +
		"n02rJNOPQgd9r0ac4N2v/yTAFPXumO78N25bpcuWf5vcL9e8THk/U2zt7wf+aAWL\n" +
		"748e0pREqNluTBJNZfmhC79Xx6GHtwqHyyduiqfPmejmiujNM/rqnA4e30Tg86Yn\n" +
		"cNZ6vLJyF72Eva1wXchukH/aLispbY+EqNPxxn4zzCWaLKHG87gaCxpVv9Tm0jSD\n" +
		"2es22NjrUbtb+2pAGnXbyDp2eGUqw0RrTQFZqt/VcmmSCE45FlcZMT28otrwG1ZB\n" +
		"kZAb5Js3wLEch3ZfYL8sjhyNRPBmJBrAvzrd8qa3rdUjkC9sKyjGAaHu2MNmFl1Y\n" +
		"JFQ3J54tGpkGgJjD7Kz3w0K6OiPDlVCNQN5sqXm24fCw85Pbi8SJiaLTp/CImrs1\n" +
		"Z3nHW5q8hljA7OGmqfOP0nZS/5zW9GHPyepsI1rW6CympYLJ15WeNzePxYS5KEX9\n" +
		"EncmkSD9b45ge95hJeJZteUCAwEAAQ==\n" +
		"-----END PUBLIC KEY-----",
};

export const jwtConstants = {
	secret: process.env.JWT_SECRET,
};

export const httpsConstants = {
	certPath: process.env.CERT_PEM_PATH,
	keyPath: process.env.KEY_PEM_PATH,
};

export const apiConstants = {
	port: +(process.env.API_PORT ?? 5050),
	version: process.env.SERVER_VERSION,
};

export const firebaseConstants = {
	serviceAccountPath: process.env.FIREBASE_ACCOUNT_PATH,
};

export const scheduleConstants = {
	cacheInvalidateDelay: +(process.env.SERVER_CACHE_INVALIDATE_DELAY ?? 5),
};
