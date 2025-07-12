export class UserDto {
    id: string;
    name: string;
    avatar?: string;

    constructor(id?: string, name?: string) {
        this.id = id ?? "";
        this.name = name ?? "";
    }


}
