import { readonly, ref } from "vue";
import {useEditingNode} from './useEditingNode'

const isReadOnly = ref(false)

export function useReadOnly()
{
    const {stopEditing} = useEditingNode();
    const toggleReadOnly = ()=>{
        isReadOnly.value = !isReadOnly.value
        if (isReadOnly.value) stopEditing()
    }

    const setReadOnly = (value) =>{
        isReadOnly.value = !!value
        if (isReadOnly.value) stopEditing()
    }

    return {isReadOnly,toggleReadOnly,setReadOnly}
}