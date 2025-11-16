import { environment } from 'environments/environment';
import { environment as devenv } from 'environments/environment.dev';

const baseUrl = environment.baseUrl;
const baseUrlDev = devenv.baseUrl;
export const uriConfig = {
    // api auth
    API_USER_LOGIN: baseUrl + '/api/login/',
    API_USER_LOGOUT: baseUrl + '/api/logout/',
    API_USER_INFOR: baseUrl + '/api/infor/',
    API_ALL_USERS: baseUrl + '/api/users/',
    API_USER_BY_ID: (id: number) => baseUrl + `/api/get-user/${id}/`,
    API_UPLOAD_AVATAR: baseUrl + '/api/upload-avatar/',
    API_USER_INFOR_UPDATE: baseUrl + '/api/update/',
    API_USER_REFRESH_TOKEN: baseUrl + '/api/refresh/',
    API_USER_RESET_PASSWORD: baseUrl + '/api/user/reset-password/',
    API_USER_CHANGE_PASSWORD: baseUrl + '/api/user/change-password/',
    API_USER_REGISTER: baseUrl + '/api/register/',
    API_USER_AUTH_GOOGLE: baseUrl + '/api/auth/google/',

    //api admin user management
    API_GET_USER: baseUrl + '/api/all/',
    API_CREATE_USER: baseUrl + '/api/register/user/',
    API_UPDATE_USER: baseUrl + '/api/update/user/',
    API_GET_LOGIN_HISTORY: baseUrl + '/api/login-event/user/',

    API_RESEND_USER_EMAIL: baseUrl + '/api/sp/re-send-email/user/',
    API_DELETE_USER: baseUrl + '/api/delete/user/',
    //api department
    API_GET_DEPARTMENT: baseUrl + '/api/department/',
    //api group
    API_GET_GROUP: baseUrl + '/api/group/',

    //api personal customer
    API_GET_FORM: baseUrl + '/api/tables/',
    API_GET_FIELD: baseUrl + '/api/tables/fields/customer/',
    API_CREATE_FORM: baseUrl + '/api/tables/create/',
    API_UPDATE_FORM: baseUrl + '/api/tables/update/',
    API_UPDATE_FORM_TEMPLATE: baseUrl + '/api/tables/assign-field/',

    //api admin app type
    API_GET_APP_TYPE: baseUrl + '/api/app-type/',
    API_GET_ALL_APP: baseUrl + '/api/app-type/all/',
    API_CREATE_APP_TYPE: baseUrl + '/api/app-type/create/',
    API_UPDATE_APP_TYPE: (id: number) =>
        baseUrl + `/api/app-type/update/${id}/`,
    API_DELETE_APP_TYPE: (id: number) =>
        baseUrl + `/api/app-type/delete/${id}/`,
    API_LOCK_SELECTED_APPS: baseUrl + '/api/app-types/lock-selected/',

    //api admin news category
    API_GET_NEWS_CATEGORY: baseUrl + '/api/news-category/list/',
    API_CREATE_NEWS_CATEGORY: baseUrl + '/api/news-category/create/',
    API_UPDATE_NEWS_CATEGORY: (id: number) =>
        baseUrl + `/api/news-category/update/${id}/`,
    API_DELETE_NEWS_CATEGORY: (id: number) =>
        baseUrl + `/api/news-category/delete/${id}/`,

    //api news
    API_GET_NEWS: baseUrl + '/api/news/',
    API_NEWS_ACCEPT: baseUrl + '/api/news/accept/',
    API_GET_NEWS_DETAIL_BY_ID: (id: number) =>
        baseUrl + `/api/news/detail/${id}/`,
    API_GET_NEWS_DETAIL_BY_SLUG: (slug: string) =>
        baseUrl + `/api/news/by_slug/${slug}/`,
    API_GET_NEWS_BY_CATEGORY: baseUrl + '/api/news/category/',

    API_CREATE_NEWS: baseUrl + '/api/news/create/',
    API_UPDATE_NEWS: (id: number) => baseUrl + `/api/news/update/${id}/`,
    API_DELETE_NEWS: (id: number) => baseUrl + `/api/news/delete/${id}/`,
    API_UPLOAD_IMAGE: baseUrl + '/api/upload-image/',
    API_UPLOAD_FILE: baseUrl + '/api/upload-file/',
    API_LIKE_NEWS: (id: number) => baseUrl + `/api/news/${id}/like/`,
    API_GET_NEWS_COMMENT: (id: number) => baseUrl + `/api/news/${id}/list-cmt/`,
    API_COMMENT_NEWS: (id: number) => baseUrl + `/api/news/${id}/comment/`,
    API_LIKE_COMMENT: (id: number) => baseUrl + `/api/comment/${id}/like/`,

    //api admin product category
    API_GET_PRODUCT_CATEGORY: baseUrl + '/api/product-category/list/',
    API_CREATE_PRODUCT_CATEGORY: baseUrl + '/api/product-category/create/',
    API_UPDATE_PRODUCT_CATEGORY: (id: number) =>
        baseUrl + `/api/product-category/update/${id}/`,
    API_DELETE_PRODUCT_CATEGORY: (id: number) =>
        baseUrl + `/api/product-category/delete/${id}/`,

    // api user customer
    API_FORM_CUSTOMER: baseUrl + '/api/tables/',
    API_GET_CUSTOMER: baseUrl + '/api/tables/customer/all-records/',
    API_CREATE_CUSTOMER: baseUrl + '/api/tables/customer/record-create/',
    API_UPDATE_CUSTOMER: baseUrl + '/api/tables/customer/record-update/',
    API_DETAIL_CUSTOMER: baseUrl + '/api/tables/customer/get-record/',
    API_DELETE_CUSTOMER: baseUrl + '/api/tables/customer/record-delete/',
    API_IMPORT_CUSTOMER: baseUrl + '/api/tables/customer/record-import/',
    API_EXPORT_CUSTOMER: baseUrl + '/api/tables/customer/record-export/',

    API_GET_LOCATE: baseUrl + '/api/locate/',
    API_GET_SOURCE: baseUrl + '/api/source/',
    API_GET_COMPANINES: baseUrl + '/api/companies/',

    //api callback
    API_VERIFY_KEYCLOAK: baseUrl + '/api/verify-keycloak/',

    //api content
    API_GET_CONTENT: baseUrl + '/api/content/',
    API_CREATE_CONTENT: baseUrl + '/api/content/',
    API_UPDATE_CONTENT: (id: number) => baseUrl + `/api/content_id/${id}/`,
    API_DELETE_CONTENT: (id: number) => baseUrl + `/api/content_id/${id}/`,
    API_FILTER_CONTENT: baseUrl + '/api/content_queryset/',

    // api feedback
    API_GET_FEEDBACK: baseUrl + '/api/feedback/',
    API_CREATE_FEEDBACK: baseUrl + '/api/feedback/create/',
    API_UPDATE_FEEDBACK: (id: number) =>
        baseUrl + `/api/feedback/update/${id}/`,
    API_DELETE_FEEDBACK: (id: number) =>
        baseUrl + `/api/feedback/delete/${id}/`,

    // api product
    API_GET_PRODUCT: baseUrl + '/api/product/',
    API_CREATE_PRODUCT: baseUrl + '/api/product/',
    API_UPDATE_PRODUCT: (id: number) => baseUrl + `/api/product_id/${id}/`,
    API_DELETE_PRODUCT: (id: number) => baseUrl + `/api/product_id/${id}/`,

    // dashboard
    API_GET_DASHBOARD: baseUrl + '/api/dashboard/',
    API_GET_RECENT_REG: baseUrl + '/api/dashboard/recentlyregistered/',
    API_GET_NUMBER_OF_LIKE: baseUrl + '/api/dashboard/numberoflike/',
    API_DASHBOARD_SSE :baseUrl + '/api/dashboard/sse/' ,


    //api chat
    API_GET_IMAGE: baseUrlDev + '/api/upload-file-message',
    API_ADMIN_INFOR: baseUrl + '/api/admin-infor/',

    //chat bot
    API_CHATBOT_CHAT: baseUrl + '/api/chatbot/chat/',
    API_CHATBOT_START_TRAINING: baseUrl + '/api/chatbot/fine-tune/start/',
    API_CHATBOT_TRAINING_STATUS: baseUrl + '/api/chatbot/sse/training-status/',
    API_CHATBOT_AUDIO: baseUrl + '/api/chatbot/tts/stream/',
    API_UPLOAD_AUDIO: baseUrl + '/api/chatbot/stt/',


    //destination
    API_DESTINATION_ALL: baseUrl + '/api/destination/list/',
    API_DESTINATION_UPDATE: (uuid:string) => baseUrl + `/api/destination/${uuid}/`,
    API_DESTINATION_DELETE: (uuid:string) => baseUrl + `/api/destination/${uuid}/`,
    API_DESTINATION_DETAIL: (slug:String) => baseUrl + `/api/destination/detail/${slug}/`,
    API_DESTINATION_CREATE: baseUrl + '/api/destination/',

    //hotel
    API_HOTEL_ALL: baseUrl + '/api/hotel/list/',
    API_HOTEL_UPDATE: (uuid:string) => baseUrl + `/api/hotel/${uuid}/`,
    API_HOTEL_DELETE: (uuid:string) => baseUrl + `/api/hotel/${uuid}/`,
    API_HOTEL_DETAIL: (uuid:string) => baseUrl + `/api/hotel/${uuid}/`,
    API_HOTEL_CREATE: baseUrl + '/api/hotel/',
    API_HOTEL_CALENDAR_PRICE: baseUrl + '/api/calendar-price/',
    API_EXPLORE_HOTELS: baseUrl + '/api/explore-hotels/',

    //room_type
    API_ROOM_TYPE_ALL: baseUrl + '/api/room_type/list/',
    API_ROOM_TYPE_UPDATE: (uuid:string) => baseUrl + `/api/room_type/${uuid}/`,
    API_ROOM_TYPE_DELETE: (uuid:string) => baseUrl + `/api/room_type/${uuid}/`,
    API_ROOM_TYPE_CREATE: baseUrl + '/api/room_type/',

    //amenity
    API_AMENITY_ALL: baseUrl + '/api/amenity/list/',
    API_AMENITY_UPDATE: (uuid:string) => baseUrl + `/api/amenity/${uuid}/`,
    API_AMENITY_DELETE: (uuid:string) => baseUrl + `/api/amenity/${uuid}/`,
    API_AMENITY_CREATE: baseUrl + '/api/amenity/',

    //room
    API_ROOM_ALL: baseUrl + '/api/room/list/',
    API_ROOM_UPDATE: (uuid:string) => baseUrl + `/api/room/${uuid}/`,
    API_ROOM_DELETE: (uuid:string) => baseUrl + `/api/room/${uuid}/`,
    API_ROOM_CREATE: baseUrl + '/api/room/',

    //booking
    API_LIST_ROOM_TYPE_RATE: baseUrl + '/api/price-per-day/',
    API_CREATE_PAYMENT: baseUrl + '/api/payment/create-payment/',
    API_CREATE_SESSTION:baseUrl + '/api/booking/create-booking-session/',
    API_CREATE_HOLE : baseUrl + '/api/booking/create-hold/',
    API_LIST_HOLD_ROOM : baseUrl + '/api/booking/get-list-hold-room/',
    API_CHECK_SESSION: baseUrl + '/api/booking/check-session/',

    //sse
    API_SSE : (session_id:string)=> baseUrl + `/api/sse/session/${session_id}/`,

    //websocket
    WEBSOCKET_URL : 'ws://localhost:8000/ws/chat/',

    //offer
    API_OFFER_ALL: baseUrl + '/api/offer/list/',
    API_OFFER_UPDATE: (uuid:string) => baseUrl + `/api/offer/${uuid}/`,
    API_OFFER_DELETE: (uuid:string) => baseUrl + `/api/offer/${uuid}/`,
    API_OFFER_CREATE: baseUrl + '/api/offer/',

    //booking
    API_BOOKING_ALL: baseUrl + '/api/booking/list/',
    API_BOOKING_UPDATE: (uuid:string) => baseUrl + `/api/booking/${uuid}/`,
    API_BOOKING_DELETE: (uuid:string) => baseUrl + `/api/booking/${uuid}/`,
    API_BOOKING_CREATE: baseUrl + '/api/booking/',

    //service
    API_SERVICE_ALL: baseUrl + '/api/service/list/',
    API_SERVICE_UPDATE: (uuid:string) => baseUrl + `/api/service/${uuid}/`,
    API_SERVICE_DELETE: (uuid:string) => baseUrl + `/api/service/${uuid}/`,
    API_SERVICE_CREATE: baseUrl + '/api/service/',
};
