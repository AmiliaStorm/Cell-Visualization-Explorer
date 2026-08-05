const STAGES = [
    "dna",
    "mrna",
    "translation",
    "transport",
    "golgi",
    "secretion"
];

export function createSimulation() {

    let stageIndex = 0;
    let timer = 0;

    const stageDuration = 6;

    let isPlaying = true;

    function update(deltaTime){

        if(!isPlaying) return;

        timer += deltaTime;

        if(timer >= stageDuration){

            timer = 0;

            stageIndex++;

            if(stageIndex >= STAGES.length){

                stageIndex = 0;

            }

        }

    }

    return{

        update,

        play(){
            isPlaying = true;
        },

        pause(){
            isPlaying = false;
        },

        next(){

            stageIndex =
            (stageIndex + 1) %
            STAGES.length;

            timer = 0;

        },

        previous(){

            stageIndex--;

            if(stageIndex < 0){

                stageIndex =
                STAGES.length-1;

            }

            timer = 0;

        },

        get stage(){

            return STAGES[stageIndex];

        },

        get progress(){

            return timer / stageDuration;

        },

        get isPlaying(){

            return isPlaying;

        }

    };

}