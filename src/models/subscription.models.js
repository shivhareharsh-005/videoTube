

import mongoose, {Schema} from "mongoose";
const subscriptionSchema = new Scheama ({

    subscriber : {
       type : Schema.Types.ObjectId,
       ref: "User"
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
}, {timeStamps : true})

export const Subscription = mongoose.model("Subscription", subscription);